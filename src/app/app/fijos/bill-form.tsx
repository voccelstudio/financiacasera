"use client";

import { useActionState } from "react";
import { saveBill } from "./actions";
import type { Category } from "@/lib/types";

export function BillForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(saveBill, undefined);

  const input =
    "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900";

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Ej: Alquiler, Luz ANDE, Tigo"
          maxLength={60}
          className={input}
        />
        <div className="flex gap-2">
          <input
            name="amount"
            inputMode="decimal"
            required
            placeholder="Monto"
            className={`${input} flex-1 tabular`}
          />
          <select name="currency" defaultValue="PYG" className="w-24 rounded-xl border border-zinc-300 dark:border-zinc-700 px-2 text-sm">
            <option value="PYG">PYG</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <select name="due_day" defaultValue="1" className={input}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              📅 Vence día {d}
            </option>
          ))}
        </select>
        <select name="category_id" defaultValue="" className={input}>
          <option value="">Sin categoría</option>
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar cuenta fija"}
      </button>
      {state?.ok && <p className="text-xs text-green-700 dark:text-green-300">✅ Cuenta fija guardada</p>}
      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
