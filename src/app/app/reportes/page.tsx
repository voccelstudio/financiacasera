import { getFamilyContext } from "@/lib/session";
import {
  getActiveMembers,
  getCategories,
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
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { from, to } = monthRange(months[0]);
  const { data: allTxs } = await supabase
    .from("transactions")
    .select("type, amount, currency, pyg_rate, date")
    .eq("family_id", family.id)
    .gte("date", from)
    .lte("date", to);

  const monthly = months.map((m) => ({ month: m, income: 0, expense: 0 }));
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  for (const t of (allTxs ?? []) as unknown as {
    type: string
    amount: number
    currency: Currency
    pyg_rate: number
    date: string
  }[]) {
    const idx = monthIndex.get(t.date.slice(0, 7));
    if (idx === undefined) continue;
    const pyg = toPyg(Number(t.amount), t.currency, Number(t.pyg_rate));
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
  const { data: shareRows } = await supabase
    .from("transaction_members")
    .select("transaction_id, member_id, amount")
    .in("transaction_id", currentTx.filter((t) => t.type === "expense").map((t) => t.id));

  const txById = new Map(currentTx.map((t) => [t.id, t]));
  for (const row of (shareRows ?? []) as unknown as {
    transaction_id: string
    member_id: string
    amount: number
  }[]) {
    const tx = txById.get(row.transaction_id);
    if (!tx) continue;
    const pyg = toPyg(Number(row.amount), tx.currency as Currency, Number(tx.pyg_rate));
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
          <p className="text-xs text-zinc-500">A dónde se va la plata de tu familia.</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs"
          />
          <button className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">
            Ver
          </button>
        </form>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
          <p className="text-[11px] text-zinc-500">Ingresos</p>
          <p className="truncate text-sm font-bold text-green-600 tabular">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
          <p className="text-[11px] text-zinc-500">Gastos</p>
          <p className="truncate text-sm font-bold text-red-500 tabular">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center">
          <p className="text-[11px] text-zinc-500">Ahorro</p>
          <p
            className={`truncate text-sm font-bold tabular ${
              summary.balance >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {formatMoney(summary.balance)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">📈 Ingresos vs. gastos (6 meses)</h2>
        <MonthlyChart data={monthly} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">🍕 Gastos por categoría</h2>
          <CategoryPie data={pieData} />
          {topCat && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              Mayor gasto: <b>{topCat.name}</b> ({formatMoney(topCat.value)})
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">🎯 Gastos por miembro</h2>
          <MemberBar data={memberData} />
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Solo gastos asignados a miembros en {monthLabel(month)}.
          </p>
        </section>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
        💡 <b>Regla 50/30/20:</b> intentá que el 50% cubra lo necesario (casa, comida,
        servicios), el 30% lo deseable (salidas, ropa) y el 20% vaya directo a ahorro.
      </p>
    </div>
  );
}
