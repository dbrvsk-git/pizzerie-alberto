import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageTitle, inputBaseClass } from "@/app/admin/ui";
import { getDayOverview, type Block, type Reservation } from "@/lib/reservations";
import { CLOSING_HOUR, OPENING_HOUR, TABLES } from "@/lib/restaurant";
import { addDays, formatDate, isValidDate, isValidTime, nowLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Přehled" };

type TableState =
  | { kind: "free" }
  | { kind: "blocked"; block: Block }
  | { kind: "pending" | "confirmed"; reservation: Reservation };

const STATE_STYLES = {
  free: "border-line bg-white text-gray-700",
  blocked: "border-gray-300 bg-gray-200 text-gray-500",
  pending: "border-yellow-400 bg-yellow-100 text-yellow-900",
  confirmed: "border-green-600 bg-green-100 text-green-900",
};

const STATE_LABELS = { free: "volný", blocked: "blokace", pending: "čeká", confirmed: "potvrzený" };

function covers(item: { date_from: string; date_to: string }, moment: string) {
  return item.date_from <= moment && moment < item.date_to;
}

function tableState(table: string, moment: string, reservations: Reservation[], blocks: Block[]): TableState {
  const block = blocks.find((b) => (b.table_label === null || b.table_label === table) && covers(b, moment));
  if (block) return { kind: "blocked", block };
  const reservation = reservations.find((r) => r.table_label === table && covers(r, moment));
  if (reservation) return { kind: reservation.status as "pending" | "confirmed", reservation };
  return { kind: "free" };
}

/** Pozice úseku na časové ose v procentech. */
function span(item: { date_from: string; date_to: string }, date: string) {
  const hours = (local: string) =>
    local.slice(0, 10) < date ? 0 : local.slice(0, 10) > date ? 24 : Number(local.slice(11, 13)) + Number(local.slice(14, 16)) / 60;
  const total = CLOSING_HOUR - OPENING_HOUR;
  const start = Math.max(0, (hours(item.date_from) - OPENING_HOUR) / total);
  const end = Math.min(1, (hours(item.date_to) - OPENING_HOUR) / total);
  return { left: `${start * 100}%`, width: `${Math.max(0.02, end - start) * 100}%` };
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const now = nowLocal();
  const today = now.slice(0, 10);
  const date = typeof params.date === "string" && isValidDate(params.date) ? params.date : today;
  const time =
    typeof params.time === "string" && isValidTime(params.time)
      ? params.time
      : date === today
        ? now.slice(11, 16)
        : "18:00";
  const moment = `${date} ${time}`;

  const { reservations, blocks } = await getDayOverview(date);
  const hours = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, i) => OPENING_HOUR + i);

  const guests = reservations.reduce((sum, r) => sum + r.guests, 0);
  const pending = reservations.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageTitle
        actions={
          <form className="flex flex-wrap items-center gap-2">
            <Link href={`/admin?date=${addDays(date, -1)}`} className="btn-secondary" aria-label="Předchozí den">
              ←
            </Link>
            <input type="date" name="date" defaultValue={date} className={inputBaseClass} aria-label="Datum" />
            <input type="time" name="time" defaultValue={time} step={1800} className={inputBaseClass} aria-label="Čas" />
            <button type="submit" className="btn-primary">
              Zobrazit
            </button>
            <Link href={`/admin?date=${addDays(date, 1)}`} className="btn-secondary" aria-label="Další den">
              →
            </Link>
          </form>
        }
      >
        Přehled – {formatDate(date)}
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Rezervací", value: reservations.length },
          { label: "Hostů", value: guests },
          { label: "Čeká na potvrzení", value: pending },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white/80 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card
        title={`Plánek stolů v ${time}`}
        actions={
          <Link href={`/admin/rezervace?date=${date}`} className="font-semibold text-cihla hover:underline">
            Seznam rezervací dne →
          </Link>
        }
      >
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-4">
          {TABLES.map((table) => {
            const state = tableState(table.id, moment, reservations, blocks);
            const content = (
              <div
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border font-medium ${STATE_STYLES[state.kind]}`}
              >
                <span className="text-lg font-semibold">{table.id}</span>
                <span className="text-[11px] text-gray-600">{table.capacity} místa</span>
                {"reservation" in state && (
                  <span className="mt-1 max-w-full truncate px-1 text-[11px]">{state.reservation.name}</span>
                )}
                <span className="absolute inset-x-2 bottom-2 text-center text-[10px] font-semibold uppercase">
                  {STATE_LABELS[state.kind]}
                </span>
              </div>
            );
            return "reservation" in state ? (
              <Link key={table.id} href={`/admin/rezervace/${state.reservation.id}`} className="transition hover:scale-[1.03]">
                {content}
              </Link>
            ) : (
              <Link
                key={table.id}
                href={`/admin/rezervace/nova?date=${date}&time=${time}&table=${table.id}`}
                className="transition hover:scale-[1.03]"
                title={state.kind === "free" ? "Vytvořit rezervaci" : (state.block.reason ?? "Blokace")}
              >
                {content}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Kliknutím na obsazený stůl otevřete rezervaci, na volný vytvoříte novou.
        </p>
      </Card>

      <Card title="Časová osa dne">
        <div className="overflow-x-auto text-xs">
          <div className="min-w-[640px]">
            <div className="ml-12 flex">
              {hours.map((h) => (
                <div key={h} className="flex-1 text-[10px] text-gray-500">
                  {h}:00
                </div>
              ))}
            </div>
            {TABLES.map((table) => (
              <div key={table.id} className="flex items-stretch">
                <div className="w-12 pr-2 text-right text-[11px] font-semibold leading-7 text-gray-700">{table.id}</div>
                <div className="relative h-7 flex-1 border-t border-gray-200">
                  <div className="absolute inset-0 flex">
                    {hours.map((h) => (
                      <div key={h} className="flex-1 border-l border-dashed border-gray-200" />
                    ))}
                  </div>
                  {blocks
                    .filter((b) => b.table_label === null || b.table_label === table.id)
                    .map((b) => (
                      <div
                        key={`b${b.id}`}
                        className="absolute top-2 h-3 rounded-full bg-gray-400/80"
                        style={span(b, date)}
                        title={b.reason ?? "Blokace"}
                      />
                    ))}
                  {reservations
                    .filter((r) => r.table_label === table.id)
                    .map((r) => (
                      <Link
                        key={r.id}
                        href={`/admin/rezervace/${r.id}`}
                        className={`absolute top-1 h-5 truncate rounded-full px-2 text-[10px] leading-5 text-white opacity-90 hover:opacity-100 ${
                          r.status === "confirmed" ? "bg-green-600" : "bg-yellow-500"
                        }`}
                        style={span(r, date)}
                        title={`${r.date_from.slice(11)}–${r.date_to.slice(11)} ${r.name} (${r.guests} os.)`}
                      >
                        {r.name}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Zelená = potvrzená, žlutá = čeká na potvrzení, šedá = blokace (např. uzavřená společnost).
        </p>
      </Card>
    </>
  );
}
