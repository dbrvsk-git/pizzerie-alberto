// Vytvoří tabulky a naplní jídelní lístek. Spouští se automaticky před `next build`
// (tedy při každém nasazení na Vercel). Bez DATABASE_URL se přeskočí.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { schemaStatements, seedMenu } from "../db/schema.mjs";

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("[db-setup] DATABASE_URL není nastavená – přeskakuji.");
  process.exit(0);
}

const sql = neon(url);
const query = (text, params = []) => sql.query(text, params);

for (const statement of schemaStatements) {
  await query(statement);
}

const menu = JSON.parse(readFileSync(new URL("../db/seed-menu.json", import.meta.url), "utf8"));
const seeded = await seedMenu(query, menu);

console.log(`[db-setup] Schéma připraveno${seeded ? ", jídelní lístek naplněn" : ""}.`);
