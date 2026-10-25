import type { Metadata } from "next";
import { confirmReservation } from "@/app/actions";
import { getReservationByToken } from "@/lib/reservations";
import { BackHome, Notice, PageShell, ReservationSummary } from "../ReservationCard";

export const metadata: Metadata = { title: "Potvrzení rezervace | Pizzerie Alberto", robots: "noindex" };

// Potvrzení vyžaduje kliknutí na tlačítko – samotné otevření odkazu nic nemění,
// takže rezervaci nepotvrdí ani poštovní filtr, který odkazy v e-mailech prochází.
export default async function ConfirmPage({ searchParams }: PageProps<"/rezervace/potvrdit">) {
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

  if (reservation.status === "confirmed") {
    return (
      <PageShell title="Rezervace potvrzena">
        <Notice tone="success">Děkujeme, těšíme se na vás!</Notice>
        <ReservationSummary reservation={reservation} />
        <BackHome />
      </PageShell>
    );
  }

  if (reservation.status === "cancelled" || reservation.expired) {
    return (
      <PageShell title="Rezervace není aktivní">
        <Notice tone="error">
          {reservation.expired
            ? "Platnost potvrzovacího odkazu vypršela a rezervace byla zrušena."
            : "Tato rezervace byla zrušena."}{" "}
          Vytvořte prosím novou rezervaci.
        </Notice>
        <ReservationSummary reservation={reservation} />
        <BackHome />
      </PageShell>
    );
  }

  return (
    <PageShell title="Potvrzení rezervace">
      <ReservationSummary reservation={reservation} />
      <form action={confirmReservation} className="flex justify-between gap-3">
        <input type="hidden" name="token" value={token} />
        <BackHome />
        <button type="submit" className="btn-primary">
          Potvrdit rezervaci
        </button>
      </form>
    </PageShell>
  );
}
