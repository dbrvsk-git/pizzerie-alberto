"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changePassword,
  createFirstAdmin,
  login,
  logout,
  requireAdmin,
} from "@/lib/auth";
import {
  createMenuItem,
  deleteMenuItem,
  getCategories,
  reorderMenuItems,
  updateMenuItem,
  type MenuItemInput,
} from "@/lib/menu";
import {
  cancelReservation,
  createAdminReservation,
  createBlock,
  deleteBlock,
  deleteReservation,
  updateReservation,
  type AdminReservationInput,
} from "@/lib/reservations";
import type { ReservationStatus } from "@/lib/restaurant";
import { getBaseUrl } from "@/lib/url";

export type FormState =
  | { error?: string; success?: string; values?: Record<string, string> }
  | undefined;

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/**
 * Chyba formuláře včetně odeslaných hodnot – React po odeslání formulář vyprázdní,
 * takže je formulář po chybě vyplní znovu (hesla záměrně ne).
 */
function formError(error: string, formData: FormData): FormState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !/password|current|setup_key/.test(key) && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return { error, values };
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// =====================================================
// Přihlášení
// =====================================================

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const ok = await login(str(formData, "email"), str(formData, "password"));
  if (!ok) return formError("Nesprávný e-mail nebo heslo.", formData);
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function setupAction(_: FormState, formData: FormData): Promise<FormState> {
  // na Vercelu je potřeba instalační klíč, jinak by si účet mohl založit kdokoli
  const setupKey = process.env.SETUP_KEY;
  if (process.env.VERCEL && !setupKey) return { error: "Chybí proměnná SETUP_KEY." };
  if (setupKey && !safeEqual(str(formData, "setup_key"), setupKey)) {
    return { error: "Nesprávný instalační klíč." };
  }

  const email = str(formData, "email").trim();
  const password = str(formData, "password");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return formError("Zadejte platný e-mail.", formData);
  if (password.length < 10) return formError("Heslo musí mít alespoň 10 znaků.", formData);
  if (password !== str(formData, "password2")) return formError("Hesla se neshodují.", formData);

  const created = await createFirstAdmin(email, password);
  if (!created) return { error: "Administrátor už existuje. Přihlaste se." };
  redirect("/admin");
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const next = str(formData, "password");

  if (next.length < 10) return { error: "Nové heslo musí mít alespoň 10 znaků." };
  if (next !== str(formData, "password2")) return { error: "Hesla se neshodují." };

  const ok = await changePassword(session.userId, str(formData, "current"), next);
  return ok ? { success: "Heslo bylo změněno." } : { error: "Současné heslo není správné." };
}

// =====================================================
// Rezervace
// =====================================================

function reservationInput(formData: FormData): AdminReservationInput {
  return {
    date: str(formData, "date"),
    time: str(formData, "time"),
    table: str(formData, "table"),
    guests: Number(formData.get("guests")),
    name: str(formData, "name"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    note: str(formData, "note"),
    status: str(formData, "status") as ReservationStatus,
  };
}

export async function createReservationAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await createAdminReservation(reservationInput(formData), {
    sendInfoMail: formData.get("send_mail") === "on",
    baseUrl: await getBaseUrl(),
  });
  if (!result.ok) return formError(result.error, formData);
  redirect(`/admin/rezervace/${result.data}?saved=1`);
}

export async function updateReservationAction(
  id: number,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const result = await updateReservation(id, reservationInput(formData));
  if (!result.ok) return formError(result.error, formData);
  revalidatePath("/admin", "layout");
  return { success: "Uloženo." };
}

export async function cancelReservationAction(formData: FormData) {
  await requireAdmin();
  await cancelReservation(Number(formData.get("id")));
  revalidatePath("/admin", "layout");
}

export async function deleteReservationAction(formData: FormData) {
  await requireAdmin();
  await deleteReservation(Number(formData.get("id")));
  redirect("/admin/rezervace");
}

// ----- blokace -----

export async function createBlockAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await createBlock({
    date: str(formData, "date"),
    timeFrom: str(formData, "time_from"),
    timeTo: str(formData, "time_to"),
    table: str(formData, "table"),
    reason: str(formData, "reason"),
  });
  if (!result.ok) return formError(result.error, formData);
  revalidatePath("/admin", "layout");
  return { success: "Blokace přidána." };
}

export async function deleteBlockAction(formData: FormData) {
  await requireAdmin();
  await deleteBlock(Number(formData.get("id")));
  revalidatePath("/admin", "layout");
}

// =====================================================
// Jídelní lístek
// =====================================================

async function menuItemInput(formData: FormData): Promise<MenuItemInput | string> {
  const name = str(formData, "name").trim();
  const description = str(formData, "description").trim();
  const price = Number(formData.get("price"));
  const categoryId = Number(formData.get("category_id"));

  if (!name || name.length > 100) return "Vyplňte název (max. 100 znaků).";
  if (description.length > 300) return "Popis může mít max. 300 znaků.";
  if (!Number.isInteger(price) || price < 0 || price > 100000) return "Zadejte cenu v celých korunách.";
  const categories = await getCategories();
  if (!categories.some((c) => c.id === categoryId)) return "Vyberte kategorii.";

  return { category_id: categoryId, name, description, price, is_active: formData.get("is_active") === "on" };
}

export async function createMenuItemAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = await menuItemInput(formData);
  if (typeof input === "string") return formError(input, formData);
  await createMenuItem(input);
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function updateMenuItemAction(id: number, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = await menuItemInput(formData);
  if (typeof input === "string") return formError(input, formData);
  await updateMenuItem(id, input);
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireAdmin();
  await deleteMenuItem(Number(formData.get("id")));
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function reorderMenuAction(ids: number[]) {
  await requireAdmin();
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) return;
  await reorderMenuItems(ids);
  revalidatePath("/");
  revalidatePath("/admin/menu");
}
