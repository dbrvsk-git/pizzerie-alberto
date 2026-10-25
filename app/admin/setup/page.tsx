import type { Metadata } from "next";
import Link from "next/link";
import { SetupForm } from "@/app/admin/AuthForms";
import { hasAnyAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nastavení administrátora" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const exists = await hasAnyAdmin();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white/80 p-8 shadow-xl">
        <p className="font-head text-2xl font-bold text-cihla">Pizzerie Alberto</p>
        <h1 className="mb-2 mt-1 font-body text-xl font-semibold">Nastavení administrátora</h1>
        {exists ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            Administrátor už existuje.{" "}
            <Link href="/admin/login" className="font-semibold underline">
              Přihlaste se
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="mb-6 text-gray-600">
              Vytvořte účet administrátora. Tato stránka funguje jen jednou – dokud žádný účet neexistuje.
            </p>
            <SetupForm needsKey={Boolean(process.env.SETUP_KEY || process.env.VERCEL)} />
          </>
        )}
      </div>
    </div>
  );
}
