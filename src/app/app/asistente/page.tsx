import { getFamilyContext } from "@/lib/session";
import {
  getBudgetsWithSpent,
  getCategories,
  getDebts,
  getGoals,
  getLatestRate,
  getRecurringBills,
  getTransactions,
  summarize,
} from "@/lib/queries";
import {
  currentMonth,
  monthLabel,
  monthRange,
  previousMonths,
  toPyg,
} from "@/lib/money";
import { AssistantClient, type AssistantFacts } from "./assistant-client";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AsistentePage() {
  const { family } = await getFamilyContext();
  const month = currentMonth();
  const prevMonth = previousMonths(2, month)[0];
  const { from } = monthRange(prevMonth);
  const { to } = monthRange(month);

  const [rangeTx, budgets, bills, debts, goals, rate, categories] =
    await Promise.all([
      getTransactions(family.id, { from, to }, 400),
      getBudgetsWithSpent(family.id, month),
      getRecurringBills(family.id),
      getDebts(family.id),
      getGoals(family.id),
      getLatestRate(family.id),
      getCategories(family.id),
    ]);

  const currentTx = rangeTx.filter((t) => t.date.startsWith(month));
  const prevTx = rangeTx.filter((t) => t.date.startsWith(prevMonth));
  const summary = summarize(currentTx);
  const prevExpense = summarize(prevTx).expense;

  // Cuentas pagadas este mes (payBill crea "Pago: <nombre>")
  const paidNames = new Set(
    currentTx
      .filter((t) => t.type === "expense" && (t.description ?? "").toLowerCase().startsWith("pago:"))
      .map((t) => (t.description ?? "").replace(/^Pago:\s*/i, "").trim().toLowerCase())
  );
  const now = new Date();
  const todayDay = now.getDate();
  const overdueBills = bills
    .filter((b) => b.due_day < todayDay && !paidNames.has(b.name.toLowerCase()))
    .map((b) => ({
      name: b.name,
      dueDay: b.due_day,
      amount: Number(b.amount),
      currency: b.currency as Currency,
    }));
  const upcomingBills = bills
    .filter((b) => b.due_day >= todayDay && !paidNames.has(b.name.toLowerCase()))
    .sort((a, b) => a.due_day - b.due_day)
    .map((b) => ({
      name: b.name,
      dueDay: b.due_day,
      amount: Number(b.amount),
      currency: b.currency as Currency,
    }));

  // Deudas
  let debtsOwe = 0;
  let debtsLent = 0;
  let debtCount = 0;
  for (const d of debts) {
    if (!d.active || Number(d.paid_amount) >= Number(d.total_amount)) continue;
    debtCount++;
    const pending = toPyg(
      Number(d.total_amount) - Number(d.paid_amount),
      d.currency,
      Number(d.pyg_rate)
    );
    if (d.direction === "owe") debtsOwe += pending;
    else debtsLent += pending;
  }

  // Mayor gasto del mes
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const byCat = new Map<string, number>();
  for (const t of currentTx) {
    if (t.type !== "expense" || !t.category_id) continue;
    byCat.set(
      t.category_id,
      (byCat.get(t.category_id) ?? 0) + toPyg(Number(t.amount), t.currency, Number(t.pyg_rate))
    );
  }
  const topEntry = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry
    ? {
        name: catMap.get(topEntry[0])?.name ?? "Sin categoría",
        icon: catMap.get(topEntry[0])?.icon ?? "📌",
        amount: topEntry[1],
        pct: summary.expense > 0 ? Math.round((topEntry[1] / summary.expense) * 100) : 0,
      }
    : null;

  // Entretenimiento (salidas) con su presupuesto si existe
  const leisureCat = categories.find((c) => /salida|entretenim/i.test(c.name));
  const leisureSpent = leisureCat ? (byCat.get(leisureCat.id) ?? 0) : 0;
  const leisureBudgetRow = budgets.find(
    (b) => leisureCat && b.budget.category_id === leisureCat.id
  );
  const leisureBudget = leisureBudgetRow ? Number(leisureBudgetRow.budget.amount) : null;

  const daysInMonth = monthRange(month).to.slice(-2);
  const facts: AssistantFacts = {
    monthLabel: monthLabel(month),
    prevMonthLabel: monthLabel(prevMonth),
    income: summary.income,
    expense: summary.expense,
    balance: summary.balance,
    prevExpense,
    monthPct: Math.min(100, Math.round((todayDay / Number(daysInMonth)) * 100)),
    topCategory,
    overdueBills,
    upcomingBills,
    paidBillCount: bills.length - overdueBills.length - upcomingBills.length,
    totalBills: bills.length,
    debtsOwe,
    debtsLent,
    debtCount,
    goals: goals.map((g) => ({
      name: g.name,
      emoji: g.emoji,
      saved: g.saved,
      target: Number(g.target_amount),
      currency: g.currency,
    })),
    leisureSpent,
    leisureBudget,
    rate,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Asistente 🤖</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Preguntale a tu propia plata: responde con los datos de tu familia, al
          instante y sin internet.
        </p>
      </div>

      <AssistantClient facts={facts} />

      <p className="rounded-xl bg-blue-50 dark:bg-blue-950 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        🔒 <b>Privado:</b> el asistente calcula todo con tus datos locales — nada sale
        de tu familia ni se envía a servicios de terceros.
      </p>
    </div>
  );
}
