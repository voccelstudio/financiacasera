"use client";

import { useEffect, useState } from "react";

export type PaletteId =
  | "guarani"
  | "rio"
  | "sol"
  | "lapacho"
  | "orquidea"
  | "tierra"
  | "contraste";

const STORAGE_KEY = "fc-palette";

export const PALETTES: { id: PaletteId; name: string; emoji: string; swatch: string }[] = [
  { id: "guarani", name: "Guaraní", emoji: "🌿", swatch: "#16a34a" },
  { id: "rio", name: "Río", emoji: "💧", swatch: "#2563eb" },
  { id: "sol", name: "Sol", emoji: "☀️", swatch: "#d97706" },
  { id: "lapacho", name: "Lapacho", emoji: "🌸", swatch: "#db2777" },
  { id: "orquidea", name: "Orquídea", emoji: "🪻", swatch: "#9333ea" },
  { id: "tierra", name: "Tierra", emoji: "🌄", swatch: "#ea580c" },
  { id: "contraste", name: "Alto contraste", emoji: "♿", swatch: "#1f3bb3" },
];

/** Grilla de paletas para Ajustes → Apariencia. */
export function PalettePicker() {
  const [active, setActive] = useState<PaletteId>("guarani");

  useEffect(() => {
    // Cargamos la paleta guardada de forma asíncrona (hidratación limpia)
    const t = setTimeout(() => {
      const saved = (localStorage.getItem(STORAGE_KEY) as PaletteId) || "guarani";
      setActive(PALETTES.some((p) => p.id === saved) ? saved : "guarani");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function choose(id: PaletteId) {
    setActive(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute("data-theme", id);
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Paleta de color">
      {PALETTES.map((p, i) => {
        const selected = active === p.id;
        // Con 7 paletas, la última ocupa todo el ancho (evita la fila huérfana)
        const fullWidth = i === PALETTES.length - 1 && PALETTES.length % 3 === 1;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(p.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${fullWidth ? "col-span-3" : ""} ${
              selected
                ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950 font-semibold text-brand-700 dark:text-brand-300"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
            }`}
          >
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: p.swatch }}
            />
            <span className="truncate">
              {p.emoji} {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
