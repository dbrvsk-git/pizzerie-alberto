// Práce s časem restaurace. Server na Vercelu běží v UTC, rezervace se ale
// zadávají a ukládají v místním čase (Europe/Prague) jako "YYYY-MM-DD HH:MM".

export const TIME_ZONE = "Europe/Prague";

const pragueFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Aktuální místní čas restaurace jako "YYYY-MM-DD HH:MM". */
export function nowLocal(): string {
  return pragueFormatter.format(new Date()).replace(",", "");
}

export function todayLocal(): string {
  return nowLocal().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(date);
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/** Přičte minuty k místnímu času "YYYY-MM-DD HH:MM" (bez ohledu na časové pásmo). */
export function addMinutes(local: string, minutes: number): string {
  const d = new Date(`${local.replace(" ", "T")}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function addDays(date: string, days: number): string {
  return addMinutes(`${date} 00:00`, days * 24 * 60).slice(0, 10);
}

/** "2026-03-07" → "7. 3. 2026" */
export function formatDate(date: string): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return `${d}. ${m}. ${y}`;
}

/** "2026-03-07 18:30:00" → "18:30" */
export function formatTime(local: string): string {
  return local.slice(11, 16);
}
