import type { Metadata } from "next";
import Link from "next/link";
import { createReservationAction } from "@/app/admin/actions";
import { Card, PageTitle } from "@/app/admin/ui";
import { TABLE_IDS } from "@/lib/restaurant";
import { isValidDate, isValidTime, todayLocal } from "@/lib/time";
import ReservationForm from "../ReservationForm";

export const metadata: Metadata = { title: "Nová rezervace" };

export default async function NewReservationPage({ searchParams }: PageProps<"/admin/rezervace/nova">) {
  const params = await searchParams;
  const pick = (key: string, valid: (v: string) => boolean, fallback: string) =>
    typeof params[key] === "string" && valid(params[key] as string) ? (params[key] as string) : fallback;

  return (
    <>
      <PageTitle actions={<Link href="/admin/rezervace" className="btn-secondary">← Zpět na seznam</Link>}>
        Nová rezervace
      </PageTitle>
      <Card>
        <p className="mb-4 text-gray-600">
          Pro rezervace přijaté telefonicky nebo osobně. Kolize s jinou rezervací stejného stolu se ohlídá automaticky.
        </p>
        <ReservationForm
          action={createReservationAction}
          isNew
          defaults={{
            date: pick("date", isValidDate, todayLocal()),
            time: pick("time", isValidTime, "18:00"),
            table: pick("table", (v) => TABLE_IDS.includes(v), "S1"),
            guests: 2,
            name: "",
            email: "",
            phone: "",
            note: "",
            status: "confirmed",
          }}
        />
      </Card>
    </>
  );
}
