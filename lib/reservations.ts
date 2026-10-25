import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { isOverlapError, query, queryOne } from "@/lib/db";
import { escapeHtml, sendMail } from "@/lib/mail";
import {
  CONFIRMATION_MINUTES,
  MAX_DAYS_AHEAD,
  MAX_ONLINE_GUESTS,
  RESERVATION_MINUTES,
  TABLE_IDS,
  TIME_SLOTS,
  findTable,
  type ReservationStatus,
} from "@/lib/restaurant";
import {
  addDays,
  addMinutes,
  formatDate,
  formatTime,
  isValidDate,
  isValidTime,
  nowLocal,
  todayLocal,
} from "@/lib/time";

export type Reservation = {
  id: number;
  table_label: string;
  date_from: string; // "YYYY-MM-DD HH:MM" místního času
  date_to: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  note: string | null;
  status: ReservationStatus;
  created_at: string;
};

export type Block = {
  id: number;
  table_label: string | null;
  date_from: string;
  date_to: string;
  reason: string | null;
};

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const RESERVATION_COLUMNS = `
  id, table_label,
  to_char(date_from, 'YYYY-MM-DD HH24:MI') AS date_from,
  to_char(date_to, 'YYYY-MM-DD HH24:MI') AS date_to,
  guests, name, email, phone, note, status,
  to_char(created_at AT TIME ZONE 'Europe/Prague', 'YYYY-MM-DD HH24:MI') AS created_at`;

const BLOCK_COLUMNS = `
  id, table_label,
  to_char(date_from, 'YYYY-MM-DD HH24:MI') AS date_from,
  to_char(date_to, 'YYYY-MM-DD HH24:MI') AS date_to,
  reason`;

// Rezervace, která drží stůl: potvrzená, nebo čekající s platným odkazem
const ACTIVE = `(status = 'confirmed' OR (status = 'pending'
  AND (confirmation_expires_at IS NULL OR confirmation_expires_at > now())))`;

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Zruší nepotvrzené rezervace, kterým vypršel potvrzovací odkaz. */
async function cancelExpired(): Promise<void> {
  await query(
    `UPDATE reservations SET status = 'cancelled', cancelled_at = now()
     WHERE status = 'pending' AND confirmation_expires_at < now()`,
  );
}

// =====================================================
// Validace
// =====================================================

export type ContactInput = { name: string; email: string; phone: string; note: string };

function validateContact(input: ContactInput, { emailRequired }: { emailRequired: boolean }) {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const note = input.note.trim();

  if (!name || name.length > 100) return fail("Vyplňte jméno (max. 100 znaků).");
  if (emailRequired && !email) return fail("Vyplňte e-mail.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Neplatný e-mail.");
  if (!/^\+?[\d\s()-]{9,20}$/.test(phone)) return fail("Neplatné telefonní číslo.");
  if (note.length > 500) return fail("Poznámka může mít max. 500 znaků.");

  return { ok: true as const, data: { name, email, phone, note: note || null } };
}

// =====================================================
// Veřejná část
// =====================================================

/** Vrátí stoly obsazené rezervacemi nebo blokacemi v daném termínu. */
export async function getBusyTables(date: string, time: string): Promise<Result<string[]>> {
  if (!isValidDate(date) || !isValidTime(time)) return fail("Neplatné datum nebo čas.");

  const start = `${date} ${time}`;
  const end = addMinutes(start, RESERVATION_MINUTES);

  const [reserved, blocks] = await Promise.all([
    query<{ table_label: string }>(
      `SELECT DISTINCT table_label FROM reservations
       WHERE ${ACTIVE} AND tsrange(date_from, date_to) && tsrange($1::timestamp, $2::timestamp)`,
      [start, end],
    ),
    query<{ table_label: string | null }>(
      `SELECT table_label FROM blocks
       WHERE tsrange(date_from, date_to) && tsrange($1::timestamp, $2::timestamp)`,
      [start, end],
    ),
  ]);

  if (blocks.some((b) => b.table_label === null)) return { ok: true, data: TABLE_IDS };

  const busy = new Set([...reserved, ...blocks].map((r) => r.table_label as string));
  return { ok: true, data: TABLE_IDS.filter((id) => busy.has(id)) };
}

export type PublicReservationInput = ContactInput & {
  date: string;
  time: string;
  guests: number;
  table: string;
};

export async function createPublicReservation(
  input: PublicReservationInput,
  baseUrl: string,
): Promise<Result> {
  const { date, time, guests } = input;
  const table = findTable(input.table);

  if (!isValidDate(date) || !TIME_SLOTS.includes(time)) return fail("Neplatné datum nebo čas.");
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_ONLINE_GUESTS) {
    return fail(`Online lze rezervovat pro 1-${MAX_ONLINE_GUESTS} osoby.`);
  }
  if (!table) return fail("Neplatný stůl.");
  if (table.capacity < guests) return fail(`Stůl ${table.id} je jen pro ${table.capacity} osoby.`);

  const start = `${date} ${time}`;
  if (start <= nowLocal()) return fail("Tento termín už proběhl.");
  if (date > addDays(todayLocal(), MAX_DAYS_AHEAD)) {
    return fail(`Rezervovat lze nejvýše ${MAX_DAYS_AHEAD} dní dopředu.`);
  }

  const contact = validateContact(input, { emailRequired: true });
  if (!contact.ok) return contact;

  const busy = await getBusyTables(date, time);
  if (!busy.ok) return busy;
  if (busy.data.includes(table.id)) return fail("Stůl je v tomto čase obsazený. Vyberte jiný.");

  await cancelExpired();

  const token = randomBytes(32).toString("base64url");
  const end = addMinutes(start, RESERVATION_MINUTES);

  let id: number;
  try {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO reservations
         (table_label, date_from, date_to, guests, name, email, phone, note,
          status, token_hash, confirmation_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9,
               now() + make_interval(mins => $10))
       RETURNING id`,
      [
        table.id, start, end, guests,
        contact.data.name, contact.data.email, contact.data.phone, contact.data.note,
        hashToken(token), CONFIRMATION_MINUTES,
      ],
    );
    id = row!.id;
  } catch (err) {
    // někdo jiný mezitím obsadil stejný stůl
    if (isOverlapError(err)) return fail("Stůl byl právě obsazen. Vyberte prosím jiný.");
    throw err;
  }

  try {
    await sendMail(confirmationEmail({ ...contact.data, table: table.id, guests, start, end }, baseUrl, token));
  } catch (err) {
    console.error("[reservation] e-mail se nepodařilo odeslat", err);
    await query(`UPDATE reservations SET status = 'cancelled', cancelled_at = now() WHERE id = $1`, [id]);
    return fail("Nepodařilo se odeslat potvrzovací e-mail. Zkuste to prosím znovu.");
  }

  return { ok: true, data: undefined };
}

type EmailData = {
  name: string;
  email: string;
  phone: string;
  table: string;
  guests: number;
  start: string;
  end: string;
};

function summary(r: EmailData): string {
  return `${formatDate(r.start)}, ${formatTime(r.start)}-${formatTime(r.end)}, stůl ${r.table}, počet osob: ${r.guests}`;
}

function confirmationEmail(r: EmailData, baseUrl: string, token: string) {
  const confirmUrl = `${baseUrl}/rezervace/potvrdit?token=${token}`;
  const cancelUrl = `${baseUrl}/rezervace/zrusit?token=${token}`;

  return {
    to: r.email,
    subject: "Potvrďte prosím rezervaci - Pizzerie Alberto",
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 12px">Potvrďte prosím rezervaci</h2>
        <p><strong>${escapeHtml(summary(r))}</strong></p>
        <p>Jméno: ${escapeHtml(r.name)}<br/>Telefon: ${escapeHtml(r.phone)}</p>
        <p>
          <a href="${confirmUrl}" style="display:inline-block;background:#c34b22;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">
            Potvrdit rezervaci
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          Odkaz platí ${CONFIRMATION_MINUTES} minut. Nepotvrzená rezervace se poté zruší.<br/>
          Rezervaci můžete kdykoli <a href="${cancelUrl}">zrušit zde</a>.
        </p>
      </div>`,
    text:
      `Potvrďte prosím rezervaci v Pizzerii Alberto:\n${summary(r)}\n\n` +
      `Potvrdit: ${confirmUrl}\nZrušit: ${cancelUrl}\n\n` +
      `Odkaz platí ${CONFIRMATION_MINUTES} minut.`,
  };
}

function infoEmail(r: EmailData, baseUrl: string, token: string) {
  const cancelUrl = `${baseUrl}/rezervace/zrusit?token=${token}`;
  return {
    to: r.email,
    subject: "Vaše rezervace - Pizzerie Alberto",
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 12px">Rezervace stolu</h2>
        <p>Dobrý den, evidujeme pro vás rezervaci:</p>
        <p><strong>${escapeHtml(summary(r))}</strong></p>
        <p style="color:#6b7280;font-size:13px">Pokud nemůžete přijít, rezervaci prosím <a href="${cancelUrl}">zrušte zde</a>.</p>
      </div>`,
    text: `Evidujeme pro vás rezervaci v Pizzerii Alberto:\n${summary(r)}\n\nZrušit: ${cancelUrl}`,
  };
}

/** Rezervace podle tokenu z e-mailu (pro stránky potvrzení a zrušení). */
export async function getReservationByToken(token: string) {
  if (!token) return null;
  return queryOne<Reservation & { expired: boolean }>(
    `SELECT ${RESERVATION_COLUMNS},
       (status = 'pending' AND confirmation_expires_at < now()) AS expired
     FROM reservations WHERE token_hash = $1`,
    [hashToken(token)],
  );
}

export async function confirmByToken(token: string): Promise<Result> {
  const r = await getReservationByToken(token);
  if (!r) return fail("Odkaz je neplatný.");
  if (r.status === "cancelled") return fail("Rezervace je zrušená.");
  if (r.status === "confirmed") return { ok: true, data: undefined };
  if (r.expired) {
    await cancelExpired();
    return fail("Platnost odkazu vypršela, rezervace byla zrušena. Vytvořte prosím novou.");
  }

  await query(
    `UPDATE reservations SET status = 'confirmed', confirmed_at = now() WHERE id = $1`,
    [r.id],
  );
  return { ok: true, data: undefined };
}

export async function cancelByToken(token: string): Promise<Result> {
  const r = await getReservationByToken(token);
  if (!r) return fail("Odkaz je neplatný.");
  if (r.status === "cancelled") return { ok: true, data: undefined };
  if (r.date_from <= nowLocal()) return fail("Rezervaci, která už začala, nelze zrušit.");

  await query(
    `UPDATE reservations SET status = 'cancelled', cancelled_at = now() WHERE id = $1`,
    [r.id],
  );
  return { ok: true, data: undefined };
}

// =====================================================
// Administrace
// =====================================================

export type ReservationFilter = {
  date?: string;
  status?: ReservationStatus | "all";
  q?: string;
  past?: boolean;
};

export async function listReservations(filter: ReservationFilter): Promise<Reservation[]> {
  await cancelExpired();

  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };

  if (filter.date && isValidDate(filter.date)) add("date_from::date = ?::date", filter.date);
  if (filter.status && filter.status !== "all") add("status = ?", filter.status);
  if (filter.q) {
    params.push(`%${filter.q}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR table_label ILIKE ${p})`);
  }
  if (!filter.date && !filter.past) add("date_to >= ?::timestamp", nowLocal());

  return query<Reservation>(
    `SELECT ${RESERVATION_COLUMNS} FROM reservations
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY date_from, table_label
     LIMIT 500`,
    params,
  );
}

export async function getReservation(id: number): Promise<Reservation | null> {
  return queryOne<Reservation>(`SELECT ${RESERVATION_COLUMNS} FROM reservations WHERE id = $1`, [id]);
}

/** Rezervace a blokace pro plánek a časovou osu jednoho dne. */
export async function getDayOverview(date: string) {
  await cancelExpired();
  const [reservations, blocks] = await Promise.all([
    query<Reservation>(
      `SELECT ${RESERVATION_COLUMNS} FROM reservations
       WHERE date_from::date = $1::date AND status <> 'cancelled'
       ORDER BY date_from`,
      [date],
    ),
    query<Block>(
      `SELECT ${BLOCK_COLUMNS} FROM blocks
       WHERE tsrange(date_from, date_to) && tsrange($1::date, $1::date + 1)
       ORDER BY date_from`,
      [date],
    ),
  ]);
  return { reservations, blocks };
}

export type AdminReservationInput = ContactInput & {
  date: string;
  time: string;
  guests: number;
  table: string;
  status: ReservationStatus;
};

function validateAdminInput(input: AdminReservationInput) {
  if (!isValidDate(input.date) || !isValidTime(input.time)) return fail("Neplatné datum nebo čas.");
  if (!TABLE_IDS.includes(input.table)) return fail("Neplatný stůl.");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 10) {
    return fail("Počet osob musí být 1-10.");
  }
  if (!["pending", "confirmed", "cancelled"].includes(input.status)) return fail("Neplatný stav.");
  return validateContact(input, { emailRequired: false });
}

export async function createAdminReservation(
  input: AdminReservationInput,
  { sendInfoMail, baseUrl }: { sendInfoMail: boolean; baseUrl: string },
): Promise<Result<number>> {
  const contact = validateAdminInput(input);
  if (!contact.ok) return contact;

  await cancelExpired();

  const start = `${input.date} ${input.time}`;
  const end = addMinutes(start, RESERVATION_MINUTES);
  const token = contact.data.email ? randomBytes(32).toString("base64url") : null;

  let id: number;
  try {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO reservations
         (table_label, date_from, date_to, guests, name, email, phone, note, status, token_hash,
          confirmed_at, cancelled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               CASE WHEN $9 = 'confirmed' THEN now() END,
               CASE WHEN $9 = 'cancelled' THEN now() END)
       RETURNING id`,
      [
        input.table, start, end, input.guests,
        contact.data.name, contact.data.email, contact.data.phone, contact.data.note,
        input.status, token ? hashToken(token) : null,
      ],
    );
    id = row!.id;
  } catch (err) {
    if (isOverlapError(err)) return fail(`Stůl ${input.table} je v tomto čase obsazený.`);
    throw err;
  }

  if (sendInfoMail && token && input.status !== "cancelled") {
    try {
      await sendMail(infoEmail({ ...contact.data, table: input.table, guests: input.guests, start, end }, baseUrl, token));
    } catch (err) {
      console.error("[reservation] informační e-mail se nepodařilo odeslat", err);
    }
  }

  return { ok: true, data: id };
}

export async function updateReservation(id: number, input: AdminReservationInput): Promise<Result> {
  const contact = validateAdminInput(input);
  if (!contact.ok) return contact;

  await cancelExpired();

  const start = `${input.date} ${input.time}`;
  const end = addMinutes(start, RESERVATION_MINUTES);

  try {
    await query(
      `UPDATE reservations SET
         table_label = $2, date_from = $3, date_to = $4, guests = $5,
         name = $6, email = $7, phone = $8, note = $9, status = $10,
         confirmed_at = CASE WHEN $10 = 'confirmed' THEN COALESCE(confirmed_at, now()) ELSE confirmed_at END,
         cancelled_at = CASE WHEN $10 = 'cancelled' THEN COALESCE(cancelled_at, now()) END,
         -- ruční změna stavu ruší lhůtu na potvrzení e-mailem
         confirmation_expires_at = CASE WHEN $10 = 'pending' THEN confirmation_expires_at END
       WHERE id = $1`,
      [
        id, input.table, start, end, input.guests,
        contact.data.name, contact.data.email, contact.data.phone, contact.data.note, input.status,
      ],
    );
  } catch (err) {
    if (isOverlapError(err)) return fail(`Stůl ${input.table} je v tomto čase obsazený.`);
    throw err;
  }
  return { ok: true, data: undefined };
}

export async function cancelReservation(id: number): Promise<void> {
  await query(
    `UPDATE reservations SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, now())
     WHERE id = $1`,
    [id],
  );
}

export async function deleteReservation(id: number): Promise<void> {
  await query(`DELETE FROM reservations WHERE id = $1`, [id]);
}

// ----- blokace -----

export async function listBlocks({ past = false } = {}): Promise<Block[]> {
  return query<Block>(
    `SELECT ${BLOCK_COLUMNS} FROM blocks
     ${past ? "" : "WHERE date_to >= $1::timestamp"}
     ORDER BY date_from`,
    past ? [] : [nowLocal()],
  );
}

export async function createBlock(input: {
  date: string;
  timeFrom: string;
  timeTo: string;
  table: string;
  reason: string;
}): Promise<Result> {
  if (!isValidDate(input.date) || !isValidTime(input.timeFrom) || !isValidTime(input.timeTo)) {
    return fail("Neplatné datum nebo čas.");
  }
  if (input.timeTo <= input.timeFrom) return fail("Konec musí být po začátku.");
  if (input.table && !TABLE_IDS.includes(input.table)) return fail("Neplatný stůl.");
  if (input.reason.length > 200) return fail("Důvod může mít max. 200 znaků.");

  await query(
    `INSERT INTO blocks (table_label, date_from, date_to, reason) VALUES ($1, $2, $3, $4)`,
    [
      input.table || null,
      `${input.date} ${input.timeFrom}`,
      `${input.date} ${input.timeTo}`,
      input.reason.trim() || null,
    ],
  );
  return { ok: true, data: undefined };
}

export async function deleteBlock(id: number): Promise<void> {
  await query(`DELETE FROM blocks WHERE id = $1`, [id]);
}
