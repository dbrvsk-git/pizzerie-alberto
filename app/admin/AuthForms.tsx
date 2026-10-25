"use client";

import { useActionState } from "react";
import { loginAction, setupAction } from "@/app/admin/actions";
import { FormMessage, Label, inputClass } from "@/app/admin/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Label text="E-mail">
        <input name="email" type="email" autoComplete="username" required defaultValue={state?.values?.email} className={inputClass} />
      </Label>
      <Label text="Heslo">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Label>
      <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
        {pending ? "Přihlašuji…" : "Přihlásit"}
      </button>
    </form>
  );
}

export function SetupForm({ needsKey }: { needsKey: boolean }) {
  const [state, action, pending] = useActionState(setupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {needsKey && (
        <Label text="Instalační klíč (proměnná SETUP_KEY)">
          <input name="setup_key" type="password" autoComplete="off" required className={inputClass} />
        </Label>
      )}
      <Label text="E-mail">
        <input name="email" type="email" autoComplete="username" required defaultValue={state?.values?.email} className={inputClass} />
      </Label>
      <Label text="Heslo (min. 10 znaků)">
        <input name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Label>
      <Label text="Heslo znovu">
        <input name="password2" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </Label>
      <button type="submit" className="btn-primary w-full py-3" disabled={pending}>
        {pending ? "Vytvářím…" : "Vytvořit administrátora"}
      </button>
    </form>
  );
}
