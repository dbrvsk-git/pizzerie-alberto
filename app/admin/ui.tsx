import { STATUS_LABELS, type ReservationStatus } from "@/lib/restaurant";

export function Card({ title, actions, children }: { title?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-body text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-body text-2xl font-semibold">{children}</h1>
      {actions}
    </div>
  );
}

export function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-700">{text}</span>
      {children}
    </label>
  );
}

/** Vzhled vstupního pole bez šířky (pro pole v řádku). */
export const inputBaseClass =
  "rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cihla/40";

export const inputClass = `w-full ${inputBaseClass}`;

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "border-yellow-200 bg-yellow-100 text-yellow-800",
  confirmed: "border-green-200 bg-green-100 text-green-800",
  cancelled: "border-red-200 bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function FormMessage({ state }: { state: { error?: string; success?: string } | undefined }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        {state.success}
      </p>
    );
  }
  return null;
}
