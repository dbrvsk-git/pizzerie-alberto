import "server-only";
import { headers } from "next/headers";

/** Adresa webu pro odkazy v e-mailech (respektuje vlastní doménu na Vercelu). */
export async function getBaseUrl(): Promise<string> {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
