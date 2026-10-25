"use client";

import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#top", label: "Domů" },
  { href: "#menu", label: "Jídelní lístek" },
  { href: "#rezervace", label: "Rezervace" },
  { href: "#galerie", label: "Galerie" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const hovered = useRef(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY;
      setSolid(current > 100);
      // na desktopu se header při scrollu dolů schová, nahoru se zase ukáže
      if (window.innerWidth >= 1024 && !hovered.current) {
        setHidden(current > lastScroll.current && current > 100);
      }
      lastScroll.current = current;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        hidden ? "-translate-y-full" : ""
      } ${solid ? "bg-black" : ""}`}
      onMouseEnter={() => {
        hovered.current = true;
        setHidden(false);
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      <nav className="flex justify-between px-6 py-4 text-white lg:px-8">
        <a href="#top" className="font-head text-2xl font-bold">
          Pizzerie Alberto
        </a>

        <ul className="desk-menu hidden gap-8 text-lg font-medium lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="z-50 lg:hidden"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </nav>

      <div
        className={`fixed inset-y-0 right-0 flex w-full max-w-80 items-center justify-center bg-black/90 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ul className="space-y-10 text-center text-2xl font-semibold text-white">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
