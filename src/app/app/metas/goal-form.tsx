"use client";

import { useActionState } from "react";
import { createGoal } from "./actions";

const input =
  "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900";

export function GoalForm() {
  const [state, action, pending] = useActionState(createGoal, undefined);

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="emoji"
          maxLength={4}
          placeholder="🧊"
          aria-label="Emoji de la meta"
          className={`${input} w-16 text-center text-lg`}
        />
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Nombre (Ej: Heladera nueva)"
          className={`${input} flex-1`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          name="target"
          required
          inputMode="decimal"
          placeholder="Monto objetivo (Ej: 3200000)"
          className={`${input} w-full sm:w-56 tabular`}
        />
        <select name="currency" defaultValue="PYG" className={`${input} w-28`}>
          <option value="PYG">₲ PYG</option>
          <option value="USD">US$ USD</option>
        </select>
        <input
          type="date"
          name="deadline"
          aria-label="Fecha límite (opcional)"
          className={`${input} w-44`}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "..." : "Crear meta"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.ok && (
        <p className="text-xs text-green-700 dark:text-green-300">{state.ok}</p>
      )}
    </form>
  );
}
