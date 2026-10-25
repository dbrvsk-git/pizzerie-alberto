import type { Metadata } from "next";
import { Lato, Poiret_One } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin", "latin-ext"],
  weight: ["100", "300", "400", "700"],
});

const poiret = Poiret_One({
  variable: "--font-poiret",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pizzerie Alberto",
  description:
    "Italská pizzerie v Praze 2 – jídelní lístek a online rezervace stolu. Itálie s láskou už od roku 2005.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={`${lato.variable} ${poiret.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
