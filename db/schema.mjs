// Schéma databáze – sdílené mezi build skriptem (scripts/db-setup.mjs)
// a lokální vývojovou databází (lib/db.ts). Všechny příkazy jsou idempotentní.

export const schemaStatements = [
  `CREATE EXTENSION IF NOT EXISTS btree_gist`,

  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price INT NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  // date_from/date_to = místní čas restaurace (Europe/Prague)
  `CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    table_label TEXT NOT NULL,
    date_from TIMESTAMP NOT NULL,
    date_to TIMESTAMP NOT NULL,
    guests INT NOT NULL CHECK (guests > 0),
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    token_hash TEXT UNIQUE,
    confirmation_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (date_to > date_from),
    -- jeden stůl nemůže mít dvě aktivní rezervace ve stejném čase
    CONSTRAINT reservations_no_overlap EXCLUDE USING gist (
      table_label WITH =,
      tsrange(date_from, date_to) WITH &&
    ) WHERE (status <> 'cancelled')
  )`,

  `CREATE INDEX IF NOT EXISTS reservations_date_from_idx ON reservations (date_from)`,

  // table_label NULL = blokace všech stolů
  `CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    table_label TEXT,
    date_from TIMESTAMP NOT NULL,
    date_to TIMESTAMP NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (date_to > date_from)
  )`,

  `CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

/**
 * Naplní jídelní lístek výchozími daty, pokud je prázdný.
 * @param {(text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>} query
 * @param {{ slug: string, name: string, items: { name: string, description: string, price: number }[] }[]} menu
 */
export async function seedMenu(query, menu) {
  const [{ count }] = await query(`SELECT COUNT(*)::int AS count FROM categories`);
  if (count > 0) return false;

  for (const [catIndex, category] of menu.entries()) {
    const [{ id }] = await query(
      `INSERT INTO categories (slug, name, sort_order) VALUES ($1, $2, $3) RETURNING id`,
      [category.slug, category.name, catIndex],
    );
    for (const [itemIndex, item] of category.items.entries()) {
      await query(
        `INSERT INTO menu_items (category_id, name, description, price, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.name, item.description, item.price, itemIndex],
      );
    }
  }
  return true;
}
