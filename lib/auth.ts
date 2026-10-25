import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_HOURS,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";

// hash náhodného hesla – použije se, když účet neexistuje
const DUMMY_HASH = "$2b$12$E2PMR7yToiPC76f4mO5yqudn2g8va6bkJHlZ9gFIJizN0KbSW14hy";

/**
 * Ověří přihlášení. Volá se v každé admin stránce i server action –
 * proxy.ts dělá jen rychlé přesměrování a sám o sobě nic nechrání.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  // účet mohl být mezitím smazán
  const user = await queryOne(`SELECT id FROM admin_users WHERE id = $1`, [session.userId]);
  if (!user) redirect("/admin/login");

  return session;
}

export async function hasAnyAdmin(): Promise<boolean> {
  const row = await queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM admin_users`);
  return (row?.count ?? 0) > 0;
}

async function startSession(payload: SessionPayload): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function login(email: string, password: string): Promise<boolean> {
  const user = await queryOne<{ id: number; email: string; password_hash: string }>(
    `SELECT id, email, password_hash FROM admin_users WHERE lower(email) = lower($1)`,
    [email.trim()],
  );
  // porovnání hesla proběhne i u neexistujícího účtu, aby nešlo podle času odpovědi
  // zjistit, které e-maily existují
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return false;

  await startSession({ userId: user.id, email: user.email });
  return true;
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Vytvoří prvního administrátora. Funguje jen dokud žádný účet neexistuje. */
export async function createFirstAdmin(email: string, password: string): Promise<boolean> {
  const hash = await bcrypt.hash(password, 12);
  const row = await queryOne<{ id: number; email: string }>(
    `INSERT INTO admin_users (email, password_hash)
     SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM admin_users)
     RETURNING id, email`,
    [email.trim(), hash],
  );
  if (!row) return false;

  await startSession({ userId: row.id, email: row.email });
  return true;
}

export async function changePassword(userId: number, current: string, next: string): Promise<boolean> {
  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM admin_users WHERE id = $1`,
    [userId],
  );
  if (!user || !(await bcrypt.compare(current, user.password_hash))) return false;
  await query(`UPDATE admin_users SET password_hash = $2 WHERE id = $1`, [
    userId,
    await bcrypt.hash(next, 12),
  ]);
  return true;
}
