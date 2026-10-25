import type { Metadata } from "next";
import { cancelReservationByGuest } from "@/app/actions";
import { getReservationByToken } from "@/lib/reservations";
import { nowLocal } from "@/lib/time";
import { BackHome, Notice, PageShell, ReservationSummary } from "../ReservationCard";

export const metadata: Metadata = { title: "Zrušení rezervace | Pizzerie Alberto", robots: "noindex" };

export default async function CancelPage({ searchParams }: PageProps<"/rezervace/zrusit">) {
  const { token } = await searchParams;
  const reservation = typeof token === "string" ? await getReservationByToken(token) : null;

  if (!reservation) {
    return (
      <PageShell title="Neplatný odkaz">
        <Notice tone="error">Odkaz je neplatný nebo neúplný. Zkontrolujte, že jste ho zkopírovali celý.</Notice>
        <BackHome />
      </PageShell>
    );
  }

  if (reservation.status === "cancelled") {
    return (
      <PageShell title="Rezervace zrušena">
        <Notice tone="success">Rezervace je zrušená. Budeme rádi, když přijdete jindy.</Notice>
        <ReservationSummary reservation={reservation} />
        <BackHome />
      </PageShell>
    );
  }

  if (reservation.date_from <= nowLocal()) {
    return (
      <PageShell title="Rezervaci nelze zrušit">
        <Notice tone="info">Rezervace už začala. Pokud potřebujete něco změnit, zavolejte nám prosím.</Notice>
        <ReservationSummary reservation={reservation} />
        <BackHome />
      </PageShell>
    );
  }

  return (
    <PageShell title="Zrušit rezervaci?">
      <ReservationSummary reservation={reservation} />
      <form action={cancelReservationByGuest} className="flex justify-between gap-3">
        <input type="hidden" name="token" value={token} />
        <BackHome />
        <button type="submit" className="btn-primary bg-red-700 hover:bg-red-700/90">
          Zrušit rezervaci
        </button>
      </form>
    </PageShell>
  );
}
