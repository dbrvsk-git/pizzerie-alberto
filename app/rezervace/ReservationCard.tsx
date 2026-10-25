import Link from "next/link";
import type { Reservation } from "@/lib/reservations";
import { formatDate, formatTime } from "@/lib/time";

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-back2 p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-back3 p-8 shadow-xl">
        <Link href="/" className="font-head text-2xl font-bold text-cihla">
          Pizzerie Alberto
        </Link>
        <h1 className="mb-6 mt-4 text-3xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function ReservationSummary({ reservation: r }: { reservation: Reservation }) {
  return (
    <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-line bg-back1 p-4 text-sm">
      <dt className="text-gray-500">Datum</dt>
      <dd>{formatDate(r.date_from)}</dd>
      <dt className="text-gray-500">Čas</dt>
      <dd>
        {formatTime(r.date_from)}-{formatTime(r.date_to)}
      </dd>
      <dt className="text-gray-500">Stůl</dt>
      <dd>{r.table_label}</dd>
      <dt className="text-gray-500">Počet osob</dt>
      <dd>{r.guests}</dd>
      <dt className="text-gray-500">Jméno</dt>
      <dd>{r.name}</dd>
    </dl>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error" | "info"; children: React.ReactNode }) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return <p className={`mb-6 rounded-lg border p-3 text-sm ${styles[tone]}`}>{children}</p>;
}

export function BackHome() {
  return (
    <Link href="/" className="btn-secondary">
      Zpět na web
    </Link>
  );
}
