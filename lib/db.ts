import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { schemaStatements, seedMenu } from "@/db/schema.mjs";

type Row = Record<string, unknown>;
type QueryFn = (text: string, params?: unknown[]) => Promise<Row[]>;

// Next bundluje stránky a route handlery zvlášť – připojení sdílíme přes globalThis,
// aby lokální PGlite neběžel ve více kopiích nad stejnými soubory.
const globalDb = globalThis as typeof globalThis & { __pizzeriaDb?: Promise<QueryFn> };

// Na Vercelu (a kdekoli s DATABASE_URL) se používá Neon Postgres.
// Lokálně bez DATABASE_URL běží vestavěný Postgres (PGlite) ve složce .pglite.
async function createQueryFn(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = neon(url);
    return (text, params = []) => sql.query(text, params) as Promise<Row[]>;
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("DATABASE_URL není nastavená.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { btree_gist } = await import("@electric-sql/pglite/contrib/btree_gist");
  const pg = await PGlite.create(path.join(process.cwd(), ".pglite"), {
    extensions: { btree_gist },
  });
  const query: QueryFn = async (text, params = []) =>
    (await pg.query<Row>(text, params)).rows;

  for (const statement of schemaStatements) await pg.exec(statement);
  const menu = JSON.parse(
    readFileSync(path.join(process.cwd(), "db/seed-menu.json"), "utf8"),
  );
  await seedMenu(query, menu);

  return query;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  globalDb.__pizzeriaDb ??= createQueryFn();
  return (await globalDb.__pizzeriaDb)(text, params) as Promise<T[]>;
}

export async function queryOne<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Postgres chyba porušení exclusion constraintu (kolize rezervací). */
export function isOverlapError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23P01";
}
