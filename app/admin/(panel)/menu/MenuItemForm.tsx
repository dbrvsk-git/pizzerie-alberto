"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { FormMessage, Label, inputClass } from "@/app/admin/ui";

type Defaults = { category_id: number; name: string; description: string; price: number | ""; is_active: boolean };

export default function MenuItemForm({
  action,
  categories,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: { id: number; name: string }[];
  defaults: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // po chybě formulář znovu vyplníme odeslanými hodnotami
  const values = state?.values;

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto]">
        <Label text="Kategorie">
          <select name="category_id" defaultValue={values?.category_id ?? defaults.category_id} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Label>
        <Label text="Název">
          <input name="name" required maxLength={100} defaultValue={values?.name ?? defaults.name} className={inputClass} />
        </Label>
        <Label text="Cena (Kč)">
          <input name="price" type="number" min={0} step={1} required defaultValue={values?.price ?? defaults.price} className={inputClass} />
        </Label>
      </div>
      <Label text="Popis / složení">
        <textarea name="description" rows={2} maxLength={300} defaultValue={values?.description ?? defaults.description} className={inputClass} />
      </Label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="is_active" defaultChecked={values ? values.is_active === "on" : defaults.is_active} />
        Zobrazit na webu
      </label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Ukládám…" : submitLabel}
      </button>
    </form>
  );
}
