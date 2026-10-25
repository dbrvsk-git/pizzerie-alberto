"use client";

import Image from "next/image";
import { useState } from "react";

const IMAGES = [
  ...[11, 12, 13, 14, 15].map((n) => ({ src: `/img/${n}.jpg`, alt: "Interiér pizzerie" })),
  ...[21, 22, 23, 24, 25].map((n) => ({ src: `/img/${n}.jpg`, alt: "Jídlo z pizzerie" })),
];

export default function Gallery() {
  const [main, setMain] = useState(IMAGES[0]);

  return (
    <div className="flex flex-col items-center space-y-4 rounded-2xl bg-back1 p-2">
      <Image
        src={main.src}
        alt={main.alt}
        width={1200}
        height={800}
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="w-full rounded-lg"
      />

      <div className="grid max-w-5xl grid-cols-3 justify-between gap-6 sm:grid-cols-4 md:grid-cols-5">
        {IMAGES.map((image) => (
          <button key={image.src} type="button" onClick={() => setMain(image)} aria-label={image.alt}>
            <Image
              src={image.src}
              alt=""
              width={180}
              height={120}
              className={`h-14 rounded-lg object-cover transition hover:opacity-80 md:h-24 ${
                image.src === main.src ? "ring-2 ring-cihla" : ""
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
