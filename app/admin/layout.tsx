import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administrace", template: "%s | Administrace Pizzerie Alberto" },
  robots: "noindex, nofollow",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-back3 text-sm text-gray-800">{children}</div>;
}
