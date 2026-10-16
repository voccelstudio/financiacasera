"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Resumen", icon: "🏠" },
  { href: "/app/movimientos", label: "Movimientos", icon: "💸" },
  { href: "/app/presupuestos", label: "Presupuestos", icon: "🎯" },
  { href: "/app/reportes", label: "Reportes", icon: "📊" },
  { href: "/app/fijos", label: "Cuentas fijas", icon: "🔁" },
  { href: "/app/deudas", label: "Por pagar", icon: "💳" },
  { href: "/app/familia", label: "Familia", icon: "👨‍👩‍👧" },
  { href: "/app/tips", label: "Tips", icon: "💡" },
  { href: "/app/ajustes", label: "Ajustes", icon: "⚙️" },
];

const mobileItems = [
  { href: "/app", label: "Inicio", icon: "🏠" },
  { href: "/app/movimientos", label: "Movim.", icon: "💸" },
  { href: "/app/movimientos/nuevo", label: "Agregar", icon: "➕" },
  { href: "/app/reportes", label: "Reportes", icon: "📊" },
  { href: "/app/familia", label: "Familia", icon: "👨‍👩‍👧" },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg">
          🏡
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">Financia Casera</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Economía del hogar</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              isActive(pathname, item.href)
                ? "bg-brand-50 dark:bg-brand-950 font-semibold text-brand-700 dark:text-brand-300"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="px-5 py-4 text-[10px] text-zinc-300 dark:text-zinc-600">v1.0 · PYG/USD</p>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur md:hidden">
      {mobileItems.map((item) => {
        const active = isActive(pathname, item.href) && item.href !== "/app/movimientos/nuevo";
        const isFab = item.href === "/app/movimientos/nuevo";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
              active ? "font-semibold text-brand-700 dark:text-brand-300" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${
                isFab ? "bg-brand-600 text-white shadow-md shadow-brand-200" : ""
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
