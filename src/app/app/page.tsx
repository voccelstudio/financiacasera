import Link from "next/link";
import { getFamilyContext } from "@/lib/session";
import {
  getBudgetsWithSpent,
  getDebts,
  getGoals,
  getLatestRate,
  getRecurringBills,
  getTransactions,
  summarize,
} from "@/lib/queries";
import {
  currentMonth,
  formatMoney,
  monthLabel,
  monthRange,
  previousMonths,
  toPyg,
} from "@/lib/money";
import { computeAchievements } from "@/lib/achievements";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/app/presupuestos", icon: "🎯", label: "Presupuestos" },
  { href: "/app/metas", icon: "🐷", label: "Metas" },
  { href: "/app/fijos", icon: "🔁", label: "Cuentas fijas" },
  { href: "/app/deudas", icon: "💳", label: "Por pagar" },
  { href: "/app/asistente", icon: "🤖", label: "Asistente" },
  { href: "/app/tips", icon: "💡", label: "Tips" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>
}) {
  const { welcome } = await searchParams.then((p) => ({ welcome: p.bienvenida }));
  const { family, membership } = await getFamilyContext();
  const month = currentMonth();
  const months = previousMonths(6, month);
  const fromRange = monthRange(months[0]).from;

  // Una sola traída de ~6 meses: sirve para el resumen del mes, los últimos
  // movimientos y el cálculo de logros/rachas.
  const [allTx, budgets, bills, rate, allDebts, goals] = await Promise.all([
    getTransactions(family.id, { from: fromRange }, 600),
    getBudgetsWithSpent(family.id, month),
    getRecurringBills(family.id),
    getLatestRate(family.id),
    getDebts(family.id),
    getGoals(family.id),
  ]);

  const transactions = allTx.filter((t) => t.date.startsWith(month));
  const summary = summarize(transactions);
  const today = new Date().getDate();
  const upcoming = bills
    .filter((b) => b.due_day >= today)
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 4);
  const overdue = bills.filter((b) => b.due_day < today);

  const pendingDebts = allDebts.filter(
    (d) => d.active && Number(d.paid_amount) < Number(d.total_amount)
  );
  const debtTotal = pendingDebts.reduce(
    (acc, d) =>
      acc +
      toPyg(
        Number(d.total_amount) - Number(d.paid_amount),
        d.currency as Currency,
        Number(d.pyg_rate)
      ),
    0
  );

  const overBudget = budgets.filter((b) => b.spent > Number(b.budget.amount));
  // Alertas tempranas: 80%+ del presupuesto (naranja) o superado (rojo)
  const budgetAlerts = budgets
    .filter((b) => b.spent > Number(b.budget.amount) * 0.8)
    .sort(
      (a, b) =>
        b.spent / Number(b.budget.amount) - a.spent / Number(a.budget.amount)
    );
  const achievements = computeAchievements({
    transactions: allTx,
    budgets,
    goals,
    months,
  });
  const unlocked = achievements.filter((a) => a.achieved);
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-5">
      {welcome && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950 px-4 py-3 text-sm text-brand-800 dark:text-brand-200">
          🎉 ¡Familia <b>{welcome}</b> creada! Invitá a los demás desde la sección{" "}
          <Link href="/app/familia" className="font-semibold underline">
            Familia
          </Link>
          .
        </div>
      )}

      <div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Hola, {membership.name} 👋</p>
        <h1 className="text-xl font-bold">Resumen de {monthLabel(month)}</h1>
      </div>

      {/* ⚠️ Alertas de presupuesto: avisar ANTES de pasarse */}
      {budgetAlerts.length > 0 && (
        <section
          className={`rounded-2xl border px-4 py-3 ${
            overBudget.length > 0
              ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
              : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950"
          }`}
        >
          <p className="text-sm font-bold">
            {overBudget.length > 0 ? "🚨" : "⚠️"} Cuidado con estos gastos del mes
          </p>
          <ul className="mt-2 space-y-1.5">
            {budgetAlerts.slice(0, 5).map(({ budget, category, spent }) => {
              const limit = Number(budget.amount);
              const pct = Math.round((spent / limit) * 100);
              const exceeded = spent > limit;
              return (
                <li key={budget.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">
                    {category.icon} {category.name}
                    {exceeded ? " · ¡superado!" : ` · ${pct}% usado`}
                  </span>
                  <span
                    className={`shrink-0 font-semibold tabular ${
                      exceeded
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {exceeded
                      ? `+${formatMoney(spent - limit)}`
                      : `quedan ${formatMoney(limit - spent)}`}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/app/presupuestos"
            className="mt-2 inline-block text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Ajustar presupuestos →
          </Link>
        </section>
      )}

      {/* Tarjetas de balance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingresos del mes</p>
          <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400 tabular">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Gastos del mes</p>
          <p className="mt-1 text-xl font-bold text-red-500 dark:text-red-400 tabular">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            summary.balance >= 0
              ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950"
              : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
          }`}
        >
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Balance</p>
          <p
            className={`mt-1 text-xl font-bold tabular ${
              summary.balance >= 0 ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatMoney(summary.balance)}
          </p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-3 gap-2">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-3 text-center transition hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950"
          >
            <span className="text-xl">{l.icon}</span>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{l.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Alertas de presupuesto */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">🎯 Presupuestos</h2>
            <Link href="/app/presupuestos" className="text-xs text-brand-700 dark:text-brand-300">
              Ver todos →
            </Link>
          </div>
          {budgets.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Todavía no cargaste presupuestos.{" "}
              <Link href="/app/presupuestos" className="text-brand-700 dark:text-brand-300 underline">
                Crear uno
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 4).map(({ budget, category, spent }) => {
                const limit = Number(budget.amount);
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const exceeded = spent > limit;
                return (
                  <div key={budget.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {category.icon} {category.name}
                      </span>
                      <span
                        className={`font-semibold tabular ${
                          exceeded ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {formatMoney(spent)} / {formatMoney(limit)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          exceeded ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {overBudget.length > 0 && (
                <p className="rounded-lg bg-amber-50 dark:bg-amber-950 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                  ⚠️ {overBudget.length} categoría{overBudget.length > 1 ? "s" : ""} superó el
                  presupuesto este mes.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Cuentas fijas del mes */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">🔁 Cuentas fijas</h2>
            <Link href="/app/fijos" className="text-xs text-brand-700 dark:text-brand-300">
              Ver todas →
            </Link>
          </div>
          {bills.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Agregá alquiler, luz, internet...{" "}
              <Link href="/app/fijos" className="text-brand-700 dark:text-brand-300 underline">
                aquí
              </Link>
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {overdue.slice(0, 2).map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2"
                >
                  <span className="text-red-700 dark:text-red-300">⚠️ {b.name}</span>
                  <span className="font-semibold text-red-600 dark:text-red-400 tabular">
                    {formatMoney(Number(b.amount), b.currency as Currency)}
                  </span>
                </li>
              ))}
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-1 py-1">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    📅 {b.name} <span className="text-zinc-400 dark:text-zinc-500">· día {b.due_day}</span>
                  </span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 tabular">
                    {formatMoney(Number(b.amount), b.currency as Currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deudas pendientes */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">💳 Cuentas por pagar</h2>
            <Link href="/app/deudas" className="text-xs text-brand-700 dark:text-brand-300">
              Ver todas →
            </Link>
          </div>
          {pendingDebts.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">¡Sin deudas pendientes! 🎉</p>
          ) : (
            <>
              <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tabular">
                {formatMoney(debtTotal)}
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {pendingDebts.length} deuda{pendingDebts.length > 1 ? "s" : ""} en curso
              </p>
            </>
          )}
        </section>

        {/* Tasa de cambio */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-bold">💱 Tasa de cambio</h2>
          <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tabular">
            US$ 1 = ₲ {rate.toLocaleString("es-PY")}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Usada para convertir los montos en dólares.{" "}
            <Link href="/app/ajustes" className="text-brand-700 dark:text-brand-300 underline">
              Actualizar
            </Link>
          </p>
        </section>
      </div>

      {/* 🏅 Logros y rachas */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">🏅 Logros de la familia</h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {unlocked.length}/{achievements.length} desbloqueados
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {achievements.map((a) => (
            <div
              key={a.id}
              title={`${a.name} — ${a.desc}${a.achieved ? "" : ` (avance: ${a.progress}%)`}`}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center ${
                a.achieved
                  ? "border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950"
                  : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
              }`}
            >
              <span className={`text-lg ${a.achieved ? "" : "grayscale opacity-40"}`}>
                {a.icon}
              </span>
              <span
                className={`text-[9px] leading-tight ${
                  a.achieved
                    ? "font-semibold text-brand-800 dark:text-brand-200"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {a.achieved ? a.name : `${a.progress}%`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Últimos movimientos */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">🕒 Últimos movimientos</h2>
          <Link href="/app/movimientos" className="text-xs text-brand-700 dark:text-brand-300">
            Ver todos →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Todavía no hay movimientos este mes. Cargá el primero con el botón ➕.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-zinc-600 dark:text-zinc-300">
                  {t.description || (t.type === "income" ? "Ingreso" : "Gasto")}
                </span>
                <span
                  className={`ml-3 shrink-0 font-semibold tabular ${
                    t.type === "income" ? "text-brand-600 dark:text-brand-400" : "text-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(
                    toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate))
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
