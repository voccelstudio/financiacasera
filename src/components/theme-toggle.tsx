"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "fc-theme";

/** Aplica el tema al <html> (usado también por el script inline del layout). */
export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

const ICONS: Record<ThemeMode, string> = {
  system: "💻",
  light: "☀️",
  dark: "🌙",
};

const LABELS: Record<ThemeMode, string> = {
  system: "Tema: sistema",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

/** Botón que alterna claro / oscuro / seguir el sistema. */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    // Cargamos el modo guardado de forma asíncrona (hidratación limpia)
    const t = setTimeout(() => {
      const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system";
      setMode(saved);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Si está en "sistema", reaccionar a cambios del SO
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as ThemeMode) === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <button
      onClick={cycle}
      title={LABELS[mode]}
      aria-label={LABELS[mode]}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-950 transition"
    >
      {ICONS[mode]}
    </button>
  );
}
