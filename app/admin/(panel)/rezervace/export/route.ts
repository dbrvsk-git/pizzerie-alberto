import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import { STATUS_LABELS, type ReservationStatus } from "@/lib/restaurant";
import { todayLocal } from "@/lib/time";

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  // ochrana proti spuštění vzorce při otevření v Excelu
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "all";
  const reservations = await listReservations({
    date: params.get("date") || undefined,
    status: status in STATUS_LABELS ? (status as ReservationStatus) : "all",
    q: params.get("q") || undefined,
    past: params.get("past") === "1",
  });

  const header = ["ID", "Stůl", "Od", "Do", "Osob", "Jméno", "E-mail", "Telefon", "Poznámka", "Stav", "Vytvořeno"];
  const rows = reservations.map((r) =>
    [r.id, r.table_label, r.date_from, r.date_to, r.guests, r.name, r.email, r.phone, r.note, STATUS_LABELS[r.status], r.created_at]
      .map(csvCell)
      .join(";"),
  );

  // BOM, aby Excel správně načetl češtinu; středník jako oddělovač pro české Excely
  const csv = "﻿" + [header.map(csvCell).join(";"), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rezervace_${params.get("date") || todayLocal()}.csv"`,
    },
  });
}
