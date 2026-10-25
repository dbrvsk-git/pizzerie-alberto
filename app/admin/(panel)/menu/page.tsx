import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageTitle } from "@/app/admin/ui";
import { getMenu } from "@/lib/menu";
import MenuSorter from "./MenuSorter";

export const metadata: Metadata = { title: "Jídelní lístek" };

export default async function MenuAdminPage() {
  const menu = await getMenu({ includeInactive: true });

  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/menu/nova" className="btn-primary">
            + Přidat položku
          </Link>
        }
      >
        Jídelní lístek
      </PageTitle>
      <p className="-mt-4 text-gray-600">
        Pořadí změníte přetažením položky nebo šipkami. Změny se na webu projeví okamžitě.
      </p>

      {menu.map((category) => (
        <Card key={category.id} title={`${category.name} (${category.items.length})`}>
          {/* key zajistí nový stav seznamu po přidání/úpravě položky */}
          <MenuSorter key={category.items.map((i) => `${i.id}:${i.sort_order}`).join()} items={category.items} />
        </Card>
      ))}
    </>
  );
}
