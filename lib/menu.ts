import "server-only";
import { query, queryOne } from "@/lib/db";

export type Category = { id: number; slug: string; name: string };

export type MenuItem = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

export type MenuCategory = Category & { items: MenuItem[] };

export async function getCategories(): Promise<Category[]> {
  return query<Category>(`SELECT id, slug, name FROM categories ORDER BY sort_order, id`);
}

/** Jídelní lístek po kategoriích. Pro veřejný web jen aktivní položky. */
export async function getMenu({ includeInactive = false } = {}): Promise<MenuCategory[]> {
  const [categories, items] = await Promise.all([
    getCategories(),
    query<MenuItem>(
      `SELECT id, category_id, name, description, price, is_active, sort_order
       FROM menu_items
       ${includeInactive ? "" : "WHERE is_active"}
       ORDER BY sort_order, name`,
    ),
  ]);

  return categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.category_id === category.id),
  }));
}

export async function getMenuItem(id: number): Promise<MenuItem | null> {
  return queryOne<MenuItem>(
    `SELECT id, category_id, name, description, price, is_active, sort_order
     FROM menu_items WHERE id = $1`,
    [id],
  );
}

export type MenuItemInput = {
  category_id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
};

export async function createMenuItem(input: MenuItemInput): Promise<void> {
  // nová položka se zařadí na konec své kategorie
  await query(
    `INSERT INTO menu_items (category_id, name, description, price, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5,
       (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM menu_items WHERE category_id = $1))`,
    [input.category_id, input.name, input.description, input.price, input.is_active],
  );
}

export async function updateMenuItem(id: number, input: MenuItemInput): Promise<void> {
  await query(
    `UPDATE menu_items
     SET category_id = $2, name = $3, description = $4, price = $5, is_active = $6
     WHERE id = $1`,
    [id, input.category_id, input.name, input.description, input.price, input.is_active],
  );
}

export async function deleteMenuItem(id: number): Promise<void> {
  await query(`DELETE FROM menu_items WHERE id = $1`, [id]);
}

/** Uloží nové pořadí položek (pole id v požadovaném pořadí). */
export async function reorderMenuItems(ids: number[]): Promise<void> {
  await query(
    `UPDATE menu_items AS m SET sort_order = o.position
     FROM unnest($1::int[]) WITH ORDINALITY AS o(id, position)
     WHERE m.id = o.id`,
    [ids],
  );
}
