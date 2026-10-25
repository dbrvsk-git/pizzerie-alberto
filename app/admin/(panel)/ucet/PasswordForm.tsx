"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/admin/actions";
import { FormMessage, Label, inputClass } from "@/app/admin/ui";

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <FormMessage state={state} />
      <Label text="Současné heslo">
        <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </Label>
      <Label text="Nové heslo (min. 10 znaků)">
        <input name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Label>
      <Label text="Nové heslo znovu">
        <input name="password2" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Ukládám…" : "Změnit heslo"}
      </button>
    </form>
  );
}
