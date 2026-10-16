import { getFamilyContext } from "@/lib/session";
import {
  getBillPayments,
  getCategories,
  getLatestRate,
  getRecurringBills,
} from "@/lib/queries";
import { currentMonth, formatMoney } from "@/lib/money";
import { BillForm } from "./bill-form";
import { deleteBill, payBill, toggleBill } from "./actions";
import type { BillPayment, Currency, RecurringBill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CuentasFijasPage() {
  const { family } = await getFamilyContext();
  const [categories, bills, rate, payments] = await Promise.all([
    getCategories(family.id),
    getRecurringBills(family.id),
    getLatestRate(family.id),
    getBillPayments(family.id),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totalPyg = bills.reduce(
    (a, b) => a + (b.currency === "USD" ? Number(b.amount) * rate : Number(b.amount)),
    0
  );

  // Historial por cuenta + estado del mes en curso
  const paymentsByBill = new Map<string, BillPayment[]>();
  for (const p of payments) {
    const list = paymentsByBill.get(p.bill_id) ?? [];
    list.push(p);
    paymentsByBill.set(p.bill_id, list);
  }
  const month = currentMonth();
  const todayDay = new Date().getDate();
  const paidThisMonth = new Set(
    payments.filter((p) => p.paid_at.startsWith(month)).map((p) => p.bill_id)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Cuentas fijas</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Gastos que se repiten todos los mes: alquiler, luz, internet, cable...
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">➕ Nueva cuenta fija</h2>
        <BillForm categories={categories} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">📋 Tus cuentas ({bills.length})</h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">~{formatMoney(totalPyg)} / mes</span>
        </div>

        {bills.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Todavía no cargaste cuentas fijas. Agregá arriba la primera 👆
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {bills.map((b: RecurringBill) => {
              const cat = b.category_id ? catMap.get(b.category_id) : undefined;
              const hist = paymentsByBill.get(b.id) ?? [];
              const paid = paidThisMonth.has(b.id);
              const wasDue = b.due_day < todayDay;
              const last = hist[0];
              const prev = hist[1];
              const changed =
                last && prev && Number(last.amount) !== Number(prev.amount);
              return (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: (cat?.color ?? "#94a3b8") + "22" }}
                  >
                    {cat?.icon ?? "🔁"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                      📅 Día {b.due_day}
                      {cat ? `· ${cat.name}` : ""}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          paid
                            ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                            : wasDue
                              ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {paid ? "✅ pagado este mes" : wasDue ? "⏳ pendiente" : "programado"}
                      </span>
                    </p>
                    {changed && (
                      <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        {Number(last.amount) > Number(prev.amount) ? "⬆️ Subió" : "⬇️ Bajó"} de{" "}
                        {formatMoney(Number(prev.amount), prev.currency as Currency)} a{" "}
                        {formatMoney(Number(last.amount), last.currency as Currency)}
                      </p>
                    )}
                    {hist.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer select-none text-[11px] text-brand-700 dark:text-brand-300">
                          Ver historial ({hist.length} pago{hist.length === 1 ? "" : "s"})
                        </summary>
                        <ul className="mt-1 space-y-0.5">
                          {hist.slice(0, 6).map((p) => (
                            <li
                              key={p.id}
                              className="flex justify-between text-[11px] tabular text-zinc-500 dark:text-zinc-400"
                            >
                              <span>
                                {new Date(p.paid_at + "T12:00:00").toLocaleDateString(
                                  "es-PY",
                                  { day: "numeric", month: "short", year: "2-digit" }
                                )}
                              </span>
                              <span>
                                {formatMoney(Number(p.amount), p.currency as Currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular">
                      {formatMoney(Number(b.amount), b.currency as Currency)}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">por mes</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <form action={payBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        className="rounded-lg bg-brand-50 dark:bg-brand-950 px-2 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
                        title="Registrar como gasto de hoy"
                      >
                        Pagar
                      </button>
                    </form>
                    <form action={toggleBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="active" value={String(b.active)} />
                      <button className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
                        {b.active ? "pausar" : "reactivar"}
                      </button>
                    </form>
                    <form action={deleteBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
                        eliminar
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="rounded-xl bg-blue-50 dark:bg-blue-950 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        💡 <b>Tip:</b> tocá «Pagar» cuando cobres la factura y el gasto se registra
        automáticamente en Movimientos con la fecha de hoy.
      </p>
    </div>
  );
}
