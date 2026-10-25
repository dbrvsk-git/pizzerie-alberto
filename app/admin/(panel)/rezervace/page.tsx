import type { Metadata } from "next";
import Link from "next/link";
import { cancelReservationAction } from "@/app/admin/actions";
import ConfirmButton from "@/app/admin/ConfirmButton";
import { Card, Label, PageTitle, StatusBadge, inputClass } from "@/app/admin/ui";
import { listReservations, type ReservationFilter } from "@/lib/reservations";
import { STATUS_LABELS, type ReservationStatus } from "@/lib/restaurant";
import { formatDate, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Rezervace" };

function parseFilter(params: Record<string, string | string[] | undefined>): ReservationFilter {
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const status = get("status");
  return {
    date: get("date") || undefined,
    status: status in STATUS_LABELS ? (status as ReservationStatus) : "all",
    q: get("q").trim() || undefined,
    past: get("past") === "1",
  };
}

export default async function ReservationsPage({ searchParams }: PageProps<"/admin/rezervace">) {
  const params = await searchParams;
  const filter = parseFilter(params);
  const reservations = await listReservations(filter);

  const query = new URLSearchParams(
    Object.entries({ date: filter.date, status: filter.status, q: filter.q, past: filter.past ? "1" : undefined }).filter(
      (entry): entry is [string, string] => Boolean(entry[1]),
    ),
  ).toString();

  return (
    <>
      <PageTitle
        actions={
          <div className="flex gap-2">
            <a href={`/admin/rezervace/export?${query}`} className="btn-secondary">
              Export CSV
            </a>
            <Link href="/admin/rezervace/nova" className="btn-primary">
              + Nová rezervace
            </Link>
          </div>
        }
      >
        Rezervace
      </PageTitle>

      <Card>
        <form className="grid items-end gap-3 sm:grid-cols-[auto_auto_1fr_auto_auto]">
          <Label text="Datum">
            <input type="date" name="date" defaultValue={filter.date} className={inputClass} />
          </Label>
          <Label text="Stav">
            <select name="status" defaultValue={filter.status} className={inputClass}>
              <option value="all">Vše</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Label>
          <Label text="Hledat">
            <input name="q" defaultValue={filter.q} placeholder="jméno, e-mail, telefon, stůl…" className={inputClass} />
          </Label>
          <label className="flex items-center gap-2 pb-2 text-xs">
            <input type="checkbox" name="past" value="1" defaultChecked={filter.past} />
            i proběhlé
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Filtrovat
            </button>
            <Link href="/admin/rezervace" className="btn-secondary">
              Zrušit
            </Link>
          </div>
        </form>
      </Card>

      <Card title={`Nalezeno: ${reservations.length}`}>
        {reservations.length === 0 ? (
          <p className="text-gray-500">Žádné rezervace neodpovídají filtru.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="border-b border-line text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 pl-6">Datum</th>
                  <th className="px-3 py-2">Čas</th>
                  <th className="px-3 py-2">Stůl</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2 text-center">Osob</th>
                  <th className="px-3 py-2">Poznámka</th>
                  <th className="px-3 py-2">Stav</th>
                  <th className="px-3 py-2 pr-6 text-right">Akce</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-line/60 align-top last:border-0">
                    <td className="px-3 py-3 pl-6 whitespace-nowrap">{formatDate(r.date_from)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatTime(r.date_from)}–{formatTime(r.date_to)}
                    </td>
                    <td className="px-3 py-3 font-semibold">{r.table_label}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">
                        {r.phone}
                        {r.email && <> · {r.email}</>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">{r.guests}</td>
                    <td className="max-w-48 px-3 py-3 text-xs text-gray-600">{r.note}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3 pr-6 text-right whitespace-nowrap">
                      <Link href={`/admin/rezervace/${r.id}`} className="font-semibold text-cihla hover:underline">
                        Upravit
                      </Link>
                      {r.status !== "cancelled" && (
                        <form action={cancelReservationAction} className="ml-3 inline">
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton message={`Zrušit rezervaci ${r.name}?`} className="text-red-700 hover:underline">
                            Zrušit
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
