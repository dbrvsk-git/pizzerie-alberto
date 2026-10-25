"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { reorderMenuAction } from "@/app/admin/actions";

type Item = { id: number; name: string; description: string; price: number; is_active: boolean };

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d={up ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Seznam položek jedné kategorie - řazení přetažením myší nebo šipkami. */
export default function MenuSorter({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();

  function save(next: Item[]) {
    setItems(next);
    startSaving(() => reorderMenuAction(next.map((i) => i.id)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    save(next);
  }

  if (items.length === 0) return <p className="text-gray-500">V kategorii zatím nic není.</p>;

  return (
    <>
      <ul className="divide-y divide-line/60">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              const from = items.findIndex((i) => i.id === dragId);
              if (from !== -1) move(from, index);
            }}
            className={`flex items-center gap-3 py-2 ${dragId === item.id ? "opacity-40" : ""}`}
          >
            <span className="cursor-grab select-none text-gray-400" aria-hidden>
              ⠿
            </span>
            <div className="min-w-0 flex-1">
              <div className={`font-medium ${item.is_active ? "" : "text-gray-400 line-through"}`}>
                {item.name}
                {!item.is_active && <span className="ml-2 text-xs no-underline">(skryto)</span>}
              </div>
              <div className="truncate text-xs text-gray-500">{item.description}</div>
            </div>
            <span className="whitespace-nowrap font-semibold">{item.price} Kč</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                className="rounded px-1.5 hover:bg-back3 disabled:opacity-30"
                aria-label={`Posunout ${item.name} výš`}
              >
                <Chevron up />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1}
                className="rounded px-1.5 hover:bg-back3 disabled:opacity-30"
                aria-label={`Posunout ${item.name} níž`}
              >
                <Chevron />
              </button>
            </div>
            <Link href={`/admin/menu/${item.id}`} className="font-semibold text-cihla hover:underline">
              Upravit
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 h-4 text-xs text-gray-500">{saving ? "Ukládám pořadí…" : ""}</p>
    </>
  );
}
