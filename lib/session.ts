// Podepsaná session v cookie (JWT). Bez přístupu k databázi, takže ji může
// použít i proxy.ts pro rychlé přesměrování na přihlášení.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_HOURS = 8;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.VERCEL) throw new Error("SESSION_SECRET není nastavený.");
    return new TextEncoder().encode("local-development-secret-only");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: number; email: string };

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "number" || typeof payload.email !== "string") return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
