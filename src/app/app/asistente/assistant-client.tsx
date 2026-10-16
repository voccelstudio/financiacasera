"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { Currency } from "@/lib/types";

export interface AssistantFacts {
  monthLabel: string;
  prevMonthLabel: string;
  income: number;
  expense: number;
  balance: number;
  prevExpense: number;
  monthPct: number;
  topCategory: { name: string; icon: string; amount: number; pct: number } | null;
  overdueBills: { name: string; dueDay: number; amount: number; currency: Currency }[];
  upcomingBills: { name: string; dueDay: number; amount: number; currency: Currency }[];
  paidBillCount: number;
  totalBills: number;
  debtsOwe: number;
  debtsLent: number;
  debtCount: number;
  goals: { name: string; emoji: string; saved: number; target: number; currency: Currency }[];
  leisureSpent: number;
  leisureBudget: number | null;
  rate: number;
}

const money = (n: number, c?: Currency) => formatMoney(n, c);

interface Answer {
  id: string;
  icon: string;
  question: string;
  answer: string;
  tip?: string;
}

function buildAnswers(f: AssistantFacts): Answer[] {
  const balanceText =
    f.balance >= 0
      ? `Este mes entraron ${money(f.income)} y salieron ${money(f.expense)}. ¡Te sobran ${money(f.balance)}! Mandalos a una meta antes de que se escapen. 🐷`
      : `Este mes entraron ${money(f.income)} y salieron ${money(f.expense)}: vas ${money(Math.abs(f.balance))} en rojo. Mirá la sección de alertas en el Resumen y frená los gastos que se pueden postergar.`;

  const top = f.topCategory
    ? `El mayor gasto de ${f.monthLabel} fue ${f.topCategory.icon} ${f.topCategory.name}: ${money(f.topCategory.amount)} (${f.topCategory.pct}% de todo lo gastado).`
    : "Todavía no hay gastos con categoría este mes.";

  let billsText: string;
  let billsTip: string | undefined;
  if (f.overdueBills.length > 0) {
    billsText = `⚠️ Se vencieron y todavía no figuran como pagadas: ${f.overdueBills
      .map((b) => `${b.name} (día ${b.dueDay}, ${money(b.amount)})`)
      .join(", ")}.`;
    billsTip = "Tocá «Pagar» en Cuentas fijas y queda registrado al instante.";
  } else if (f.upcomingBills.length > 0) {
    const next = f.upcomingBills[0];
    billsText = `¡Hasta ahora todo al día! ✅ Ya pagaste ${f.paidBillCount} de ${f.totalBills} cuentas. La próxima en vencer: ${next.name} el día ${next.dueDay} (${money(next.amount, next.currency)}).`;
  } else {
    billsText = `¡Todas las cuentas de ${f.monthLabel} están pagadas! 🎉`;
  }

  const debtParts: string[] = [];
  if (f.debtsOwe > 0)
    debtParts.push(`Debés ${money(f.debtsOwe)}${f.debtCount > 1 ? ` en ${f.debtCount} deudas` : ""}`);
  if (f.debtsLent > 0) debtParts.push(`te deben ${money(f.debtsLent)}`);
  const debtText = debtParts.length
    ? `${debtParts.join(" y ")}.`
    : "¡Estás sin deudas pendientes! 🎉";

  let savingsText: string;
  if (f.goals.length === 0) {
    savingsText = "Todavía no creaste ninguna meta. Andá a Metas 🐷 y arrancá con algo chiquito.";
  } else {
    const totalSaved = f.goals.reduce((a, g) => a + g.saved, 0);
    const best = [...f.goals].sort((a, b) => b.saved / (b.target || 1) - a.saved / (a.target || 1))[0];
    const pct = best.target > 0 ? Math.min(100, Math.round((best.saved / best.target) * 100)) : 0;
    savingsText = `Llevás ${money(totalSaved)} guardados en ${f.goals.length} meta${f.goals.length === 1 ? "" : "s"}. La más cerca: ${best.emoji} «${best.name}» al ${pct}%${pct < 100 ? ` (faltan ${money(Math.max(0, best.target - best.saved))})` : " — ¡cumplida! 🏆"}.`;
  }

  let leisureText: string;
  if (f.leisureBudget != null) {
    const left = f.leisureBudget - f.leisureSpent;
    leisureText =
      left >= 0
        ? `Para salidas tenías presupuestado ${money(f.leisureBudget)} y ya gastaste ${money(f.leisureSpent)}: quedan ${money(left)}. ¡Dale nomás, sin culpa! 🍽️`
        : `Te pasaste del presupuesto de salidas en ${money(-left)} (${money(f.leisureSpent)} de ${money(f.leisureBudget)}). Mirá de dónde recortar antes del próximo fin de semana.`;
  } else if (f.income > 0) {
    const suggested = f.income * 0.3;
    const left = suggested - f.leisureSpent;
    leisureText =
      left >= 0
        ? `Usando la regla 50/30/20, podrías gastar hasta ${money(suggested)} en salidas este mes. Ya llevás ${money(f.leisureSpent)}, así que te quedan ${money(left)}.`
        : `Con la regla 50/30/20 deberías haber gastado hasta ${money(suggested)} en salidas y ya llevás ${money(f.leisureSpent)}. Este mes conviene una salida más tranquila 😅.`;
  } else {
    leisureText = "Cargá tus ingresos del mes y te digo cuánto te queda para salir.";
  }

  let compareText: string;
  if (f.prevExpense <= 0) {
    compareText = `${f.prevMonthLabel} no hay gastos registrados para comparar.`;
  } else {
    const diff = f.expense - f.prevExpense;
    const pct = Math.round((Math.abs(diff) / f.prevExpense) * 100);
    compareText =
      diff > 0
        ? `Gastaste ${money(diff)} más que en ${f.prevMonthLabel} (${money(f.prevExpense)} → ${money(f.expense)}, +${pct}%). Revisá qué cambió.`
        : diff < 0
          ? `¡Bien! Gastaste ${money(-diff)} menos que en ${f.prevMonthLabel} (${money(f.prevExpense)} → ${money(f.expense)}, −${pct}%).`
          : `Gastaste exactamente lo mismo que en ${f.prevMonthLabel}: ${money(f.expense)}.`;
  }

  return [
    {
      id: "sobra",
      icon: "💰",
      question: "¿Cuánto nos sobra este mes?",
      answer: balanceText,
      tip: f.monthPct < 100 ? `Ya vas ${f.monthPct}% del mes consumido.` : undefined,
    },
    { id: "top", icon: "🔍", question: "¿En qué gastamos más?", answer: top },
    { id: "cuentas", icon: "🔁", question: "¿Pagamos las cuentas?", answer: billsText, tip: billsTip },
    { id: "deudas", icon: "💳", question: "¿Cuánto debemos?", answer: debtText },
    { id: "ahorro", icon: "🐷", question: "¿Cómo va el ahorro?", answer: savingsText },
    { id: "salidas", icon: "🍽️", question: "¿Puedo gastar en salidas?", answer: leisureText },
    { id: "comparar", icon: "📊", question: "¿Cómo vamos vs. el mes pasado?", answer: compareText },
  ];
}

function matchQuestion(text: string, answers: Answer[]): Answer | null {
  const q = text.toLowerCase();
  const rules: [RegExp, string][] = [
    [/sobra|sobran|balance|qued[oa]|plata extra/, "sobra"],
    [/gast.*(m[aá]s|mayor)|categor|d[oó]nde/, "top"],
    [/cuenta|fijo|vence|vencim|pago.*luz|ande|essap/, "cuentas"],
    [/deuda|debo|debemos|prestamo|cuota/, "deudas"],
    [/ahorr|meta|guardar/, "ahorro"],
    [/salida|salir|cine|comer|restauran|deliveri/, "salidas"],
    [/mes pasado|compar|vari[oó]|antes/, "comparar"],
  ];
  for (const [re, id] of rules) {
    if (re.test(q)) return answers.find((a) => a.id === id) ?? null;
  }
  return null;
}

export function AssistantClient({ facts }: { facts: AssistantFacts }) {
  const answers = useMemo(() => buildAnswers(facts), [facts]);
  const [selected, setSelected] = useState<Answer | null>(answers[0] ?? null);
  const [input, setInput] = useState("");
  const [notFound, setNotFound] = useState(false);

  const askText = () => {
    const found = matchQuestion(input, answers);
    if (found) {
      setSelected(found);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pregunta libre */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askText();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setNotFound(false);
            }}
            placeholder="Ej: ¿cuánto nos sobra este mes?"
            aria-label="Escribí tu pregunta"
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Preguntar
          </button>
        </form>
        {notFound && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            No encontré esa… probá con una de las preguntas de abajo 👇
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {answers.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelected(a);
                setNotFound(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selected?.id === a.id
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950"
              }`}
            >
              {a.icon} {a.question}
            </button>
          ))}
        </div>
      </section>

      {/* Respuesta */}
      {selected && (
        <section className="rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            {selected.icon} {selected.question}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
            {selected.answer}
          </p>
          {selected.tip && (
            <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">{selected.tip}</p>
          )}
        </section>
      )}
    </div>
  );
}
