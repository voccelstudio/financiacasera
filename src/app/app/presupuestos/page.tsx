import { getFamilyContext } from "@/lib/session";
import { getBudgetsWithSpent, getCategories } from "@/lib/queries";
import { currentMonth, formatMoney, monthLabel } from "@/lib/money";
import { BudgetForm } from "./budget-form";
import { deleteBudget } from "./actions";

export const dynamic = "force-dynamic";

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month = currentMonth() } = await searchParams;
  const { family } = await getFamilyContext();

  const [categories, budgets] = await Promise.all([
    getCategories(family.id),
    getBudgetsWithSpent(family.id, month),
  ]);

  const totalLimit = budgets.reduce((a, b) => a + Number(b.budget.amount), 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Presupuestos</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Definí cuánto querés gastar por categoría cada mes.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">➕ Nuevo presupuesto</h2>
        <BudgetForm categories={categories} defaultMonth={month} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">📆 {monthLabel(month)}</h2>
          <form method="GET" className="flex items-center gap-2">
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-xs"
            />
            <button className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950">
              Ver
            </button>
          </form>
        </div>

        {budgets.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Sin presupuestos para este mes. Creá el primero arriba 👆
          </p>
        ) : (
          <>
            <div className="mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold tabular">{formatMoney(totalSpent)}</span>{" "}
              gastados de{" "}
              <span className="font-semibold tabular">{formatMoney(totalLimit)}</span>{" "}
              presupuestados
              {totalSpent > totalLimit && (
                <span className="ml-1 font-semibold text-red-600 dark:text-red-400">⚠️ excedido</span>
              )}
            </div>
            <div className="space-y-3">
              {budgets.map(({ budget, category, spent }) => {
                const limit = Number(budget.amount);
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const exceeded = spent > limit;
                return (
                  <div key={budget.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {category.icon} {category.name}
                      </span>
                      <span
                        className={`text-xs font-semibold tabular ${
                          exceeded ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {formatMoney(spent)} / {formatMoney(limit)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          exceeded
                            ? "bg-red-500"
                            : pct > 80
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span
                        className={`text-[11px] ${
                          exceeded ? "font-semibold text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {exceeded
                          ? `Te pasaste de ${formatMoney(spent - limit)}`
                          : `Te queda ${formatMoney(limit - spent)}`}
                      </span>
                      <form action={deleteBudget}>
                        <input type="hidden" name="id" value={budget.id} />
                        <button className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
                          quitar
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
