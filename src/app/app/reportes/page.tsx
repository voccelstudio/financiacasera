import { getFamilyContext } from "@/lib/session";
import {
  getActiveMembers,
  getCategories,
  getShareDetails,
  getTransactions,
  getTransactionsRange,
  summarize,
} from "@/lib/queries";
import { currentMonth, formatMoney, monthLabel, monthRange, previousMonths, toPyg } from "@/lib/money";
import { CategoryPie, MemberBar, MonthlyChart } from "@/components/charts";
import type { Category, Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month = currentMonth() } = await searchParams;
  const { family } = await getFamilyContext();

  const [categories, members, currentTx] = await Promise.all([
    getCategories(family.id),
    getActiveMembers(family.id),
    getTransactions(family.id, { month }),
  ]);

  // --- Serie mensual (6 meses) ---
  const months = previousMonths(6, month);
  const { from, to } = monthRange(months[0]);
  const allTxs = await getTransactionsRange(family.id, from, to);

  const monthly = months.map((m) => ({ month: m, income: 0, expense: 0 }));
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  for (const t of allTxs) {
    const idx = monthIndex.get(t.date.slice(0, 7));
    if (idx === undefined) continue;
    const pyg = toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate));
    if (t.type === "income") monthly[idx].income += pyg;
    else monthly[idx].expense += pyg;
  }

  // --- Gastos por categoría (mes actual) ---
  const catMap = new Map(categories.map((c: Category) => [c.id, c]));
  const byCategory = new Map<string, number>();
  const byMember = new Map<string, number>();

  for (const t of currentTx) {
    if (t.type !== "expense") continue;
    const pyg = toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate));
    if (t.category_id) {
      byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + pyg);
    }
  }

  // Repartos por miembro
  const expenseIds = currentTx.filter((t) => t.type === "expense").map((t) => t.id);
  const shareRows = await getShareDetails(expenseIds);

  for (const row of shareRows) {
    if (!row.tx || row.tx.type !== "expense") continue;
    const pyg = toPyg(Number(row.amount), row.tx.currency, Number(row.tx.pyg_rate));
    byMember.set(row.member_id, (byMember.get(row.member_id) ?? 0) + pyg);
  }

  const pieData = [...byCategory.entries()]
    .map(([catId, value]) => {
      const cat = catMap.get(catId);
      return { name: cat?.icon ? `${cat.icon} ${cat.name}` : "Sin categoría", value, color: cat?.color ?? "#94a3b8" };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const memberData = members.map((m) => ({
    name: m.name,
    value: byMember.get(m.id) ?? 0,
    color: m.color,
  }));

  const summary = summarize(currentTx);
  const topCat = pieData[0];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reportes</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">A dónde se va la plata de tu familia.</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
          />
          <button className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950">
            Ver
          </button>
        </form>
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
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Ahorro</p>
          <p
            className={`truncate text-sm font-bold tabular ${
              summary.balance >= 0 ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatMoney(summary.balance)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">📈 Ingresos vs. gastos (6 meses)</h2>
        <MonthlyChart data={monthly} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-bold">🍕 Gastos por categoría</h2>
          <CategoryPie data={pieData} />
          {topCat && (
            <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Mayor gasto: <b>{topCat.name}</b> ({formatMoney(topCat.value)})
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-bold">🎯 Gastos por miembro</h2>
          <MemberBar data={memberData} />
          <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            Solo gastos asignados a miembros en {monthLabel(month)}.
          </p>
        </section>
      </div>

      <p className="rounded-xl bg-amber-50 dark:bg-amber-950 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
        💡 <b>Regla 50/30/20:</b> intentá que el 50% cubra lo necesario (casa, comida,
        servicios), el 30% lo deseable (salidas, ropa) y el 20% vaya directo a ahorro.
      </p>
    </div>
  );
}
