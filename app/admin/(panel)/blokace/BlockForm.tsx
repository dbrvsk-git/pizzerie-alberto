"use client";

import { useActionState } from "react";
import { createBlockAction } from "@/app/admin/actions";
import { FormMessage, Label, inputClass } from "@/app/admin/ui";
import { TABLES } from "@/lib/restaurant";

export default function BlockForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(createBlockAction, undefined);
  const values = state?.values;

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Label text="Datum">
          <input name="date" type="date" required defaultValue={values?.date ?? today} className={inputClass} />
        </Label>
        <Label text="Od">
          <input name="time_from" type="time" required defaultValue={values?.time_from ?? "11:00"} className={inputClass} />
        </Label>
        <Label text="Do">
          <input name="time_to" type="time" required defaultValue={values?.time_to ?? "23:00"} className={inputClass} />
        </Label>
        <Label text="Stůl">
          <select name="table" defaultValue={values?.table ?? ""} className={inputClass}>
            <option value="">Všechny stoly</option>
            {TABLES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}
              </option>
            ))}
          </select>
        </Label>
      </div>
      <Label text="Důvod (volitelné)">
        <input name="reason" maxLength={200} defaultValue={values?.reason} placeholder="např. uzavřená společnost" className={inputClass} />
      </Label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Ukládám…" : "Přidat blokaci"}
      </button>
    </form>
  );
}
