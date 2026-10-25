"use server";

import { redirect } from "next/navigation";
import {
  cancelByToken,
  confirmByToken,
  createPublicReservation,
  type PublicReservationInput,
} from "@/lib/reservations";
import { getBaseUrl } from "@/lib/url";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createReservation(
  input: PublicReservationInput & { website?: string },
): Promise<ActionResult> {
  // honeypot: skryté pole vyplní jen roboti – tváříme se, že vše proběhlo
  if (input.website) return { ok: true };

  const result = await createPublicReservation(
    {
      date: String(input.date ?? ""),
      time: String(input.time ?? ""),
      guests: Number(input.guests),
      table: String(input.table ?? ""),
      name: String(input.name ?? ""),
      email: String(input.email ?? ""),
      phone: String(input.phone ?? ""),
      note: String(input.note ?? ""),
    },
    await getBaseUrl(),
  );
  return result.ok ? { ok: true } : result;
}

// Stránky potvrzení/zrušení zobrazují výsledek podle stavu rezervace,
// takže stačí přesměrovat zpět na stejnou adresu.

export async function confirmReservation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  await confirmByToken(token);
  redirect(`/rezervace/potvrdit?token=${encodeURIComponent(token)}`);
}

export async function cancelReservationByGuest(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  await cancelByToken(token);
  redirect(`/rezervace/zrusit?token=${encodeURIComponent(token)}`);
}
