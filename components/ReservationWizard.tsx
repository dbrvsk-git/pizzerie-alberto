"use client";

import { useEffect, useMemo, useState } from "react";
import { createReservation } from "@/app/actions";
import {
  MAX_ONLINE_GUESTS,
  RESERVATION_MINUTES,
  TABLES,
  TIME_SLOTS,
  type Table,
} from "@/lib/restaurant";

type Search = { date: string; time: string; guests: number | "" };

const STEPS = ["Výběr termínu", "Výběr stolu", "Kontaktní údaje"];

function localToday(): { date: string; time: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d}. ${m}. ${y}`;
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center justify-between text-xs sm:text-sm">
      {STEPS.map((label, index) => {
        const s = index + 1;
        const isActive = step === s;
        const isDone = step > s;
        return (
          <li key={label} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                  isDone
                    ? "border-cihla bg-cihla text-white"
                    : isActive
                      ? "border-cihla bg-cihla/5 text-cihla"
                      : "border-gray-300 text-gray-400"
                }`}
              >
                {s}
              </div>
              <span className={isActive || isDone ? "text-gray-900" : "text-gray-400"}>{label}</span>
            </div>
            {index < STEPS.length - 1 && <div className="mx-2 hidden h-px flex-1 bg-gray-200 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ search, table }: { search: Search; table?: string }) {
  return (
    <div className="rounded-lg border border-line bg-back2 p-4 text-sm text-gray-700">
      <p className="mb-1 font-medium">{table ? "Shrnutí rezervace" : "Zvolený termín"}</p>
      <p>
        {formatDate(search.date)} • {search.time} • Počet osob: {search.guests}
        {table && (
          <>
            {" "}
            • Stůl: <span className="font-semibold">{table}</span>
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Délka rezervace je maximálně {RESERVATION_MINUTES / 60} hodiny od zvoleného času.
      </p>
    </div>
  );
}

function StepDateTime({
  value,
  onChange,
  onNext,
}: {
  value: Search;
  onChange: (v: Search) => void;
  onNext: () => void;
}) {
  const today = localToday();
  // u dnešního dne nenabízet časy, které už proběhly
  const slots = value.date === today.date ? TIME_SLOTS.filter((t) => t > today.time) : TIME_SLOTS;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.date && value.time && value.guests) onNext();
      }}
    >
      <StepIndicator step={1} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Datum</span>
          <input
            type="date"
            className="field"
            min={today.date}
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value, time: "" })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Čas</span>
          <select
            className="field"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
            required
          >
            <option value="">{slots.length ? "Vyber čas" : "Dnes už nelze rezervovat"}</option>
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Počet osob</span>
        <select
          className="field"
          value={value.guests}
          onChange={(e) => onChange({ ...value, guests: e.target.value ? Number(e.target.value) : "" })}
          required
        >
          <option value="">Počet osob</option>
          {Array.from({ length: MAX_ONLINE_GUESTS }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-gray-500">
          Pro větší skupiny nám prosím zavolejte.
        </span>
      </label>

      <button type="submit" className="btn-primary mt-4 w-full py-3 text-base">
        Pokračovat na výběr stolu
      </button>
    </form>
  );
}

function StepTable({
  search,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  search: Search;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [busy, setBusy] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ date: search.date, time: search.time });
    fetch(`/api/availability?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) throw new Error(data.error);
        setBusy(data.busy);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Nepodařilo se načíst obsazenost.");
      });
    return () => {
      cancelled = true;
    };
  }, [search.date, search.time]);

  const busySet = useMemo(() => new Set(busy ?? []), [busy]);
  const guests = Number(search.guests);

  // vybraný stůl mohl být mezitím obsazen
  useEffect(() => {
    if (selected && busySet.has(selected)) onSelect(null);
  }, [busySet, selected, onSelect]);

  function handleClick(table: Table) {
    setHint("");
    if (guests > table.capacity) {
      setHint(`Pro ${guests} osoby je stůl pro 2 příliš malý. Vyberte prosím stůl pro 4 osoby.`);
      return;
    }
    const freeSmall = TABLES.some((t) => t.type === "small" && !busySet.has(t.id));
    if (guests <= 2 && table.type === "large" && freeSmall) {
      setHint("Pro 1–2 osoby prosím vyberte stůl pro 2 osoby, dokud jsou volné.");
      return;
    }
    onSelect(table.id);
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (selected) onNext();
      }}
    >
      <StepIndicator step={2} />
      <Summary search={search} />

      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Vyberte stůl na plánku</p>

        {error ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        ) : busy === null ? (
          <p className="text-xs text-gray-500">Načítám obsazenost…</p>
        ) : null}

        <div className="grid grid-cols-4 gap-3">
          {TABLES.map((table) => {
            const isSelected = selected === table.id;
            const isBusy = busySet.has(table.id);
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleClick(table)}
                disabled={isBusy || busy === null}
                aria-pressed={isSelected}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-xs font-medium transition hover:scale-[1.03] ${
                  isSelected
                    ? "border-cihla bg-cihla/10 text-cihla shadow-sm"
                    : isBusy
                      ? "cursor-not-allowed border-red-200 bg-red-50 text-red-700 opacity-80"
                      : "border-line bg-back3 text-gray-700 hover:border-cihla/60"
                }`}
              >
                <span className="text-sm">{table.id}</span>
                <span className="mt-1 text-[11px] text-gray-500">{table.capacity} místa</span>
                {table.type === "small" && (
                  <span className="absolute right-1 top-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
                    2 os.
                  </span>
                )}
                {isBusy && (
                  <span className="absolute inset-x-1 bottom-1 text-[9px] font-semibold text-red-700">obsazeno</span>
                )}
              </button>
            );
          })}
        </div>

        {hint ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{hint}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Pro 1–2 osoby jsou upřednostněny stoly pro 2 osoby. Pokud nejsou volné, můžete vybrat i čtyřmístný stůl.
          </p>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary">
          Zpět
        </button>
        <button type="submit" className="btn-primary" disabled={!selected}>
          Pokračovat na kontaktní údaje
        </button>
      </div>
    </form>
  );
}

function StepContact({
  search,
  table,
  onBack,
  onDone,
}: {
  search: Search;
  table: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await createReservation({
        date: search.date,
        time: search.time,
        guests: Number(search.guests),
        table,
        ...form,
      });
      if (result.ok) onDone();
      else setError(result.error);
    } catch {
      setError("Rezervaci se nepodařilo odeslat. Zkuste to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { key: "name", label: "Jméno a příjmení", type: "text", autoComplete: "name" },
    { key: "email", label: "E-mail", type: "email", autoComplete: "email" },
    { key: "phone", label: "Telefon", type: "tel", autoComplete: "tel" },
  ] as const;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <StepIndicator step={3} />
      <Summary search={search} table={table} />

      <div className="space-y-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{f.label}</span>
            <input
              type={f.type}
              autoComplete={f.autoComplete}
              className="field"
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              required
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Poznámka (volitelné)</span>
          <textarea
            className="field"
            rows={3}
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Např. dětská židlička, alergie…"
          />
        </label>
        {/* past na roboty – člověk pole nevidí */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary" disabled={submitting}>
          Zpět
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Odesílám…" : "Odeslat rezervaci"}
        </button>
      </div>
    </form>
  );
}

export default function ReservationWizard() {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState<Search>({ date: "", time: "", guests: "" });
  const [table, setTable] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  function reset() {
    setStep(1);
    setSearch({ date: "", time: "", guests: "" });
    setTable(null);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="space-y-4 text-center" role="status">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Zbývá potvrdit e-mail</h3>
        <p className="mx-auto max-w-sm text-sm text-gray-600">
          Děkujeme! Poslali jsme vám e-mail s potvrzovacím odkazem. Po potvrzení bude rezervace aktivní.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-4">
          Vytvořit novou rezervaci
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <StepTable
        search={search}
        selected={table}
        onSelect={setTable}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    );
  }

  if (step === 3 && table) {
    return <StepContact search={search} table={table} onBack={() => setStep(2)} onDone={() => setFinished(true)} />;
  }

  return (
    <StepDateTime
      value={search}
      onChange={(v) => {
        setSearch(v);
        setTable(null);
      }}
      onNext={() => setStep(2)}
    />
  );
}
