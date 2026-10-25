import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/AuthForms";
import { hasAnyAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Přihlášení" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyAdmin())) redirect("/admin/setup");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white/80 p-8 shadow-xl">
        <p className="font-head text-2xl font-bold text-cihla">Pizzerie Alberto</p>
        <h1 className="mb-6 mt-1 font-body text-xl font-semibold">Přihlášení do administrace</h1>
        <LoginForm />
      </div>
    </div>
  );
}
