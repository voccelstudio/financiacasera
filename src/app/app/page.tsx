import Link from "next/link";
import { getFamilyContext } from "@/lib/session";
import {
  getBudgetsWithSpent,
  getLatestRate,
  getRecurringBills,
  getTransactions,
  summarize,
} from "@/lib/queries";
import { currentMonth, formatMoney, monthLabel, toPyg } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Currency, Debt } from "@/lib/types";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/app/presupuestos", icon: "🎯", label: "Presupuestos" },
  { href: "/app/fijos", icon: "🔁", label: "Cuentas fijas" },
  { href: "/app/deudas", icon: "💳", label: "Por pagar" },
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

  const [transactions, budgets, bills, rate, supabase] = await Promise.all([
    getTransactions(family.id, { month }),
    getBudgetsWithSpent(family.id, month),
    getRecurringBills(family.id),
    getLatestRate(family.id),
    createClient(),
  ]);

  const { data: debtRows } = await supabase
    .from("debts")
    .select("*")
    .eq("family_id", family.id)
    .eq("active", true);

  const summary = summarize(transactions);
  const today = new Date().getDate();
  const upcoming = bills
    .filter((b) => b.due_day >= today)
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 4);
  const overdue = bills.filter((b) => b.due_day < today);

  const pendingDebts = ((debtRows ?? []) as unknown as Debt[]).filter(
    (d) => Number(d.paid_amount) < Number(d.total_amount)
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
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-5">
      {welcome && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          🎉 ¡Familia <b>{welcome}</b> creada! Invitá a los demás desde la sección{" "}
          <Link href="/app/familia" className="font-semibold underline">
            Familia
          </Link>
          .
        </div>
      )}

      <div>
        <p className="text-xs text-zinc-400">Hola, {membership.name} 👋</p>
        <h1 className="text-xl font-bold">Resumen de {monthLabel(month)}</h1>
      </div>

      {/* Tarjetas de balance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Ingresos del mes</p>
          <p className="mt-1 text-xl font-bold text-green-600 tabular">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Gastos del mes</p>
          <p className="mt-1 text-xl font-bold text-red-500 tabular">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            summary.balance >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className="text-xs text-zinc-500">Balance</p>
          <p
            className={`mt-1 text-xl font-bold tabular ${
              summary.balance >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {formatMoney(summary.balance)}
          </p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-2">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 bg-white px-2 py-3 text-center transition hover:border-green-300 hover:bg-green-50"
          >
            <span className="text-xl">{l.icon}</span>
            <span className="text-[11px] font-medium text-zinc-600">{l.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Alertas de presupuesto */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">🎯 Presupuestos</h2>
            <Link href="/app/presupuestos" className="text-xs text-green-700">
              Ver todos →
            </Link>
          </div>
          {budgets.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Todavía no cargaste presupuestos.{" "}
              <Link href="/app/presupuestos" className="text-green-700 underline">
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
                      <span className="text-zinc-600">
                        {category.icon} {category.name}
                      </span>
                      <span
                        className={`font-semibold tabular ${
                          exceeded ? "text-red-600" : "text-zinc-500"
                        }`}
                      >
                        {formatMoney(spent)} / {formatMoney(limit)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
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
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                  ⚠️ {overBudget.length} categoría{overBudget.length > 1 ? "s" : ""} superó el
                  presupuesto este mes.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Cuentas fijas del mes */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">🔁 Cuentas fijas</h2>
            <Link href="/app/fijos" className="text-xs text-green-700">
              Ver todas →
            </Link>
          </div>
          {bills.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Agregá alquiler, luz, internet...{" "}
              <Link href="/app/fijos" className="text-green-700 underline">
                aquí
              </Link>
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {overdue.slice(0, 2).map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2"
                >
                  <span className="text-red-700">⚠️ {b.name}</span>
                  <span className="font-semibold text-red-600 tabular">
                    {formatMoney(Number(b.amount), b.currency as Currency)}
                  </span>
                </li>
              ))}
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-1 py-1">
                  <span className="text-zinc-600">
                    📅 {b.name} <span className="text-zinc-400">· día {b.due_day}</span>
                  </span>
                  <span className="font-semibold text-zinc-700 tabular">
                    {formatMoney(Number(b.amount), b.currency as Currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deudas pendientes */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">💳 Cuentas por pagar</h2>
            <Link href="/app/deudas" className="text-xs text-green-700">
              Ver todas →
            </Link>
          </div>
          {pendingDebts.length === 0 ? (
            <p className="text-xs text-zinc-400">¡Sin deudas pendientes! 🎉</p>
          ) : (
            <>
              <p className="text-lg font-bold text-zinc-800 tabular">
                {formatMoney(debtTotal)}
              </p>
              <p className="text-[11px] text-zinc-400">
                {pendingDebts.length} deuda{pendingDebts.length > 1 ? "s" : ""} en curso
              </p>
            </>
          )}
        </section>

        {/* Tasa de cambio */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">💱 Tasa de cambio</h2>
          <p className="text-lg font-bold text-zinc-800 tabular">
            US$ 1 = ₲ {rate.toLocaleString("es-PY")}
          </p>
          <p className="text-[11px] text-zinc-400">
            Usada para convertir los montos en dólares.{" "}
            <Link href="/app/ajustes" className="text-green-700 underline">
              Actualizar
            </Link>
          </p>
        </section>
      </div>

      {/* Últimos movimientos */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">🕒 Últimos movimientos</h2>
          <Link href="/app/movimientos" className="text-xs text-green-700">
            Ver todos →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Todavía no hay movimientos este mes. Cargá el primero con el botón ➕.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-zinc-600">
                  {t.description || (t.type === "income" ? "Ingreso" : "Gasto")}
                </span>
                <span
                  className={`ml-3 shrink-0 font-semibold tabular ${
                    t.type === "income" ? "text-green-600" : "text-zinc-800"
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
