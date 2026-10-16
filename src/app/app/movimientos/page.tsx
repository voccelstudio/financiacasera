import Link from "next/link";
import { getFamilyContext } from "@/lib/session";
import {
  getActiveMembers,
  getCategories,
  getShareDetails,
  getTransactions,
  summarize,
} from "@/lib/queries";
import { currentMonth, formatMoney, monthLabel, toPyg } from "@/lib/money";
import { deleteTransaction } from "./actions";
import type { Category, Currency, FamilyMember, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    month?: string
    type?: string
    category?: string
    member?: string
  }>
}

export default async function MovimientosPage({ searchParams }: Props) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();
  const { family } = await getFamilyContext();

  const [categories, members, transactions] = await Promise.all([
    getCategories(family.id),
    getActiveMembers(family.id),
    getTransactions(family.id, {
      month,
      type: params.type === "income" || params.type === "expense" ? params.type : undefined,
      categoryId: params.category || undefined,
      memberId: params.member || undefined,
    }),
  ]);

  // Traer repartos (miembros) de los movimientos mostrados
  const shareRows = await getShareDetails(transactions.map((t) => t.id));

  const sharesByTx = new Map<
    string,
    { member_id: string; member: { name: string; color: string } | null }[]
  >();
  for (const row of shareRows) {
    const list = sharesByTx.get(row.transaction_id) ?? [];
    list.push(row);
    sharesByTx.set(row.transaction_id, list);
  }

  const summary = summarize(transactions);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Agrupar por fecha
  const byDate = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const list = byDate.get(t.date) ?? [];
    list.push(t);
    byDate.set(t.date, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Movimientos</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{monthLabel(month)}</p>
        </div>
        <Link
          href="/app/movimientos/nuevo"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          ➕ Agregar
        </Link>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Ingresos</p>
          <p className="truncate text-sm font-bold text-green-600 dark:text-green-400 tabular">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Gastos</p>
          <p className="truncate text-sm font-bold text-red-500 dark:text-red-400 tabular">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Balance</p>
          <p
            className={`truncate text-sm font-bold tabular ${
              summary.balance >= 0 ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatMoney(summary.balance)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="expense">Solo gastos</option>
          <option value="income">Solo ingresos</option>
        </select>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select
          name="member"
          defaultValue={params.member ?? ""}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">Toda la familia</option>
          {members.map((m: FamilyMember) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
        >
          Filtrar
        </button>
      </form>

      {/* Lista */}
      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
          <p className="text-3xl">🪙</p>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Sin movimientos este mes</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Cargá tu primer ingreso o gasto para empezar a ver reportes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...byDate.entries()].map(([date, rows]) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                {new Date(date + "T12:00:00").toLocaleDateString("es-PY", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {rows.map((t) => {
                  const cat = t.category_id ? catMap.get(t.category_id) : undefined;
                  const shares = sharesByTx.get(t.id) ?? [];
                  const isIncome = t.type === "income";
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ backgroundColor: (cat?.color ?? "#94a3b8") + "22" }}
                      >
                        {cat?.icon ?? (isIncome ? "💰" : "📌")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {cat?.name ?? "Sin categoría"}
                          {t.scope === "members" && shares.length > 0 && (
                            <span className="ml-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">🎯</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                          {t.description || (isIncome ? "Ingreso" : "Gasto")}
                        </p>
                        {shares.length > 0 && (
                          <p className="mt-0.5 flex flex-wrap gap-1">
                            {shares.map((s) => (
                              <span
                                key={s.member_id}
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: (s.member?.color ?? "#94a3b8") + "22",
                                  color: s.member?.color ?? "#94a3b8",
                                }}
                              >
                                {s.member?.name ?? "?"}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold tabular ${
                            isIncome ? "text-green-600 dark:text-green-400" : "text-zinc-800 dark:text-zinc-100"
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {formatMoney(
                            toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate))
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {t.currency === "USD"
                            ? `US$ ${Number(t.amount).toFixed(2)}`
                            : "₲"}
                        </p>
                      </div>
                      <Link
                        href={`/app/movimientos/${t.id}/editar`}
                        className="rounded-lg px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Editar"
                      >
                        ✏️
                      </Link>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950"
                          aria-label="Eliminar"
                        >
                          🗑️
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
