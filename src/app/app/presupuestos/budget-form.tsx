"use client";

import { useActionState } from "react";
import { saveBudget } from "./actions";
import type { Category } from "@/lib/types";

export function BudgetForm({
  categories,
  defaultMonth,
}: {
  categories: Category[];
  defaultMonth: string;
}) {
  const [state, action, pending] = useActionState(saveBudget, undefined);

  const input =
    "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900";

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <select name="category_id" required defaultValue="" className={input}>
          <option value="" disabled>
            Categoría
          </option>
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
        </select>
        <input type="month" name="month" required defaultValue={defaultMonth} className={input} />
        <input
          name="amount"
          inputMode="decimal"
          required
          placeholder="Monto en ₲"
          className={`${input} tabular`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar presupuesto"}
      </button>
      {state?.ok && <p className="text-xs text-green-700 dark:text-green-300">✅ Presupuesto guardado</p>}
      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
