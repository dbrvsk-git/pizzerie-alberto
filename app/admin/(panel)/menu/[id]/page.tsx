import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMenuItemAction, updateMenuItemAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { Card, PageTitle } from "@/app/admin/ui";
import { getCategories, getMenuItem } from "@/lib/menu";
import MenuItemForm from "../MenuItemForm";

export const metadata: Metadata = { title: "Úprava položky" };

export default async function EditMenuItemPage({ params }: PageProps<"/admin/menu/[id]">) {
  const { id } = await params;
  const [item, categories] = await Promise.all([
    /^\d+$/.test(id) ? getMenuItem(Number(id)) : null,
    getCategories(),
  ]);
  if (!item) notFound();

  return (
    <>
      <PageTitle actions={<Link href="/admin/menu" className="btn-secondary">← Zpět</Link>}>{item.name}</PageTitle>
      <Card>
        <MenuItemForm
          action={updateMenuItemAction.bind(null, item.id)}
          categories={categories}
          submitLabel="Uložit změny"
          defaults={item}
        />
      </Card>
      <Card title="Smazání">
        <p className="mb-3 text-gray-600">
          Pokud položku nabízíte jen sezónně, stačí ji skrýt (odškrtnout „Zobrazit na webu“).
        </p>
        <form action={deleteMenuItemAction}>
          <input type="hidden" name="id" value={item.id} />
          <ConfirmButton message={`Opravdu smazat „${item.name}“?`} className="btn-secondary text-red-700">
            Smazat položku
          </ConfirmButton>
        </form>
      </Card>
    </>
  );
}
