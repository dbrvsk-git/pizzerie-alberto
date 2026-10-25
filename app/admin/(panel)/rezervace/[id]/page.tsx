import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteReservationAction, updateReservationAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { Card, PageTitle, StatusBadge } from "@/app/admin/ui";
import { getReservation } from "@/lib/reservations";
import ReservationForm from "../ReservationForm";

export const metadata: Metadata = { title: "Rezervace" };

export default async function EditReservationPage({ params, searchParams }: PageProps<"/admin/rezervace/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const reservation = /^\d+$/.test(id) ? await getReservation(Number(id)) : null;
  if (!reservation) notFound();

  return (
    <>
      <PageTitle actions={<Link href="/admin/rezervace" className="btn-secondary">← Zpět na seznam</Link>}>
        Rezervace #{reservation.id} <StatusBadge status={reservation.status} />
      </PageTitle>

      {saved && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
          Rezervace vytvořena.
        </p>
      )}

      <Card>
        <ReservationForm
          action={updateReservationAction.bind(null, reservation.id)}
          isNew={false}
          defaults={{
            date: reservation.date_from.slice(0, 10),
            time: reservation.date_from.slice(11, 16),
            table: reservation.table_label,
            guests: reservation.guests,
            name: reservation.name,
            email: reservation.email,
            phone: reservation.phone,
            note: reservation.note ?? "",
            status: reservation.status,
          }}
        />
        <p className="mt-4 text-xs text-gray-500">Vytvořeno {reservation.created_at}</p>
      </Card>

      <Card title="Smazání">
        <p className="mb-3 text-gray-600">
          Rezervaci obvykle stačí zrušit (zůstane v historii). Smazání je nevratné.
        </p>
        <form action={deleteReservationAction}>
          <input type="hidden" name="id" value={reservation.id} />
          <ConfirmButton message="Opravdu smazat rezervaci? Tuto akci nelze vrátit." className="btn-secondary text-red-700">
            Smazat rezervaci
          </ConfirmButton>
        </form>
      </Card>
    </>
  );
}
