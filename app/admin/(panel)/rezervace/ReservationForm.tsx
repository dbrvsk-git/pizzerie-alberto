"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { FormMessage, Label, inputClass } from "@/app/admin/ui";
import { STATUS_LABELS, TABLES } from "@/lib/restaurant";

export type ReservationDefaults = {
  date: string;
  time: string;
  table: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  note: string;
  status: string;
};

export default function ReservationForm({
  action,
  defaults,
  isNew,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: ReservationDefaults;
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // po chybě formulář znovu vyplníme odeslanými hodnotami
  const v = (key: keyof ReservationDefaults) => state?.values?.[key] ?? String(defaults[key]);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-4">
        <Label text="Datum">
          <input name="date" type="date" required defaultValue={v("date")} className={inputClass} />
        </Label>
        <Label text="Čas (rezervace trvá 2 h)">
          <input name="time" type="time" required defaultValue={v("time")} className={inputClass} />
        </Label>
        <Label text="Stůl">
          <select name="table" required defaultValue={v("table")} className={inputClass}>
            {TABLES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} ({t.capacity} místa)
              </option>
            ))}
          </select>
        </Label>
        <Label text="Počet osob">
          <input name="guests" type="number" min={1} max={10} required defaultValue={v("guests")} className={inputClass} />
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Label text="Jméno">
          <input name="name" required maxLength={100} defaultValue={v("name")} className={inputClass} />
        </Label>
        <Label text="Telefon">
          <input name="phone" type="tel" required defaultValue={v("phone")} className={inputClass} />
        </Label>
        <Label text="E-mail (volitelné)">
          <input name="email" type="email" defaultValue={v("email")} className={inputClass} />
        </Label>
      </div>

      <Label text="Poznámka">
        <textarea name="note" rows={3} maxLength={500} defaultValue={v("note")} className={inputClass} />
      </Label>

      <div className="flex flex-wrap items-end gap-6">
        <Label text="Stav">
          <select name="status" defaultValue={v("status")} className={inputClass}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Label>
        {isNew && (
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" name="send_mail" defaultChecked={state?.values?.send_mail === "on"} />
            Poslat hostovi e-mail s rekapitulací (pokud je vyplněn)
          </label>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Ukládám…" : isNew ? "Vytvořit rezervaci" : "Uložit změny"}
      </button>
    </form>
  );
}
