"use client";

import { useEffect } from "react";

/** Postupně zobrazí prvky s třídou .tag, jakmile se dostanou do viewportu. */
export default function FadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
    );
    document.querySelectorAll(".tag").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
