import type { Metadata } from "next";
import Link from "next/link";
import { createMenuItemAction } from "@/app/admin/actions";
import { Card, PageTitle } from "@/app/admin/ui";
import { getCategories } from "@/lib/menu";
import MenuItemForm from "../MenuItemForm";

export const metadata: Metadata = { title: "Nová položka" };

export default async function NewMenuItemPage() {
  const categories = await getCategories();

  return (
    <>
      <PageTitle actions={<Link href="/admin/menu" className="btn-secondary">← Zpět</Link>}>Nová položka</PageTitle>
      <Card>
        <MenuItemForm
          action={createMenuItemAction}
          categories={categories}
          submitLabel="Přidat položku"
          defaults={{ category_id: categories[0]?.id ?? 0, name: "", description: "", price: "", is_active: true }}
        />
      </Card>
    </>
  );
}
