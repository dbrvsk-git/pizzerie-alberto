"use client";

import { useState } from "react";

type Item = { id: number; name: string; description: string; price: number };
type Category = { slug: string; name: string; items: Item[] };

export default function MenuSection({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const current = categories.find((c) => c.slug === active);

  return (
    <>
      <div className="mb-12 flex flex-wrap justify-center gap-3" role="tablist">
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            role="tab"
            aria-selected={category.slug === active}
            onClick={() => setActive(category.slug)}
            className={`cursor-pointer rounded-full px-6 py-3 font-medium transition ${
              category.slug === active
                ? "bg-cihla text-white shadow"
                : "bg-passive text-gray-700 hover:bg-back1"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* key přepne animaci při změně kategorie */}
      <div key={active} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2" role="tabpanel">
        {!current || current.items.length === 0 ? (
          <p className="col-span-2 text-center">Žádné položky v této kategorii</p>
        ) : (
          current.items.map((item, index) => (
            <div
              key={item.id}
              className="menu-card rounded-xl border border-line bg-back3 p-6 transition-all duration-300 hover:bg-back1 hover:shadow-xl"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="mb-2 flex justify-between gap-4">
                <h3 className="text-base font-semibold uppercase">{item.name}</h3>
                <span className="whitespace-nowrap font-bold text-cihla">{item.price} Kč</span>
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
