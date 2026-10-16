"use client";

import { useActionState, useState } from "react";
import { contributeToGoal, deleteGoal } from "./actions";
import { formatMoney } from "@/lib/money";
import type { FamilyMember, GoalWithProgress } from "@/lib/types";

export function GoalCard({
  goal,
  members,
}: {
  goal: GoalWithProgress;
  members: FamilyMember[];
}) {
  const [state, action, pending] = useActionState(contributeToGoal, undefined);
  const [confirming, setConfirming] = useState(false);

  const target = Number(goal.target_amount);
  const saved = Number(goal.saved);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const done = saved >= target && target > 0;
  const missing = Math.max(0, target - saved);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            <span className="mr-1">{goal.emoji || "🎯"}</span>
            {goal.name}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {goal.contrib_count} aporte{goal.contrib_count === 1 ? "" : "s"}
            {goal.deadline &&
              ` · hasta ${new Date(goal.deadline + "T12:00:00").toLocaleDateString("es-PY", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
              })}`}
          </p>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-zinc-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 dark:hover:text-red-400"
          >
            eliminar
          </button>
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-[11px]">
            <form action={deleteGoal}>
              <input type="hidden" name="id" value={goal.id} />
              <button className="font-semibold text-red-600 dark:text-red-400 hover:underline">
                ¿seguro?
              </button>
            </form>
            <button
              onClick={() => setConfirming(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {/* Barra de avance */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold tabular text-zinc-700 dark:text-zinc-200">
            {formatMoney(saved, goal.currency)}
            <span className="font-normal text-zinc-400 dark:text-zinc-500">
              {" "}
              de {formatMoney(target, goal.currency)}
            </span>
          </span>
          <span
            className={`font-bold tabular ${
              done ? "text-green-600 dark:text-green-400" : "text-brand-700 dark:text-brand-300"
            }`}
          >
            {done ? "¡100% 🎉" : `${pct}%`}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${
              done ? "bg-green-500" : "bg-brand-600"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!done && (
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Faltan {formatMoney(missing, goal.currency)}
          </p>
        )}
      </div>

      {/* Aportar */}
      <form action={action} className="mt-3 space-y-2">
        <input type="hidden" name="goal_id" value={goal.id} />
        <input type="hidden" name="date" value={today} />
        <div className="flex flex-wrap gap-2">
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder={goal.currency === "USD" ? "US$ monto" : "₲ monto"}
            aria-label="Monto del aporte"
            className="w-32 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm tabular outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900"
          />
          <select
            name="member_id"
            aria-label="Quién aporta"
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-2 text-sm outline-none focus:border-brand-600"
          >
            <option value="">La familia</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            name="note"
            maxLength={60}
            placeholder="Nota (opcional)"
            aria-label="Nota del aporte"
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "..." : "Aportar"}
          </button>
        </div>
        {state?.error && (
          <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
        )}
        {state?.ok && <p className="text-xs text-green-700 dark:text-green-300">{state.ok}</p>}
      </form>
    </div>
  );
}
