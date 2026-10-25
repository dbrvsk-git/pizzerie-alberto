import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/rezervace", label: "Rezervace" },
  { href: "/admin/blokace", label: "Blokace stolů" },
  { href: "/admin/menu", label: "Jídelní lístek" },
  { href: "/admin/ucet", label: "Účet" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/admin" className="font-head text-xl font-bold text-cihla">
            Pizzerie Alberto
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 font-medium hover:bg-back3">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{session.email}</span>
            <Link href="/" className="hover:underline" target="_blank">
              Web ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="font-semibold text-cihla hover:underline">
                Odhlásit
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-6">{children}</main>
    </>
  );
}
