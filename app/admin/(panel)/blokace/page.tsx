import type { Metadata } from "next";
import { deleteBlockAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { Card, PageTitle } from "@/app/admin/ui";
import { listBlocks } from "@/lib/reservations";
import { formatDate, formatTime, todayLocal } from "@/lib/time";
import BlockForm from "./BlockForm";

export const metadata: Metadata = { title: "Blokace stolů" };

export default async function BlocksPage() {
  const blocks = await listBlocks();

  return (
    <>
      <PageTitle>Blokace stolů</PageTitle>

      <Card title="Nová blokace">
        <p className="mb-4 text-gray-600">
          Zablokované stoly nejdou v daném čase rezervovat online – např. kvůli uzavřené společnosti nebo opravě.
        </p>
        <BlockForm today={todayLocal()} />
      </Card>

      <Card title="Aktuální a budoucí blokace">
        {blocks.length === 0 ? (
          <p className="text-gray-500">Žádné blokace.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-line text-xs text-gray-500">
              <tr>
                <th className="py-2">Datum</th>
                <th className="py-2">Čas</th>
                <th className="py-2">Stůl</th>
                <th className="py-2">Důvod</th>
                <th className="py-2 text-right">Akce</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-b border-line/60 last:border-0">
                  <td className="py-2">{formatDate(b.date_from)}</td>
                  <td className="py-2">
                    {formatTime(b.date_from)}–{formatTime(b.date_to)}
                  </td>
                  <td className="py-2 font-semibold">{b.table_label ?? "Všechny"}</td>
                  <td className="py-2 text-gray-600">{b.reason}</td>
                  <td className="py-2 text-right">
                    <form action={deleteBlockAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <ConfirmButton message="Smazat blokaci?" className="text-red-700 hover:underline">
                        Smazat
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
