import { getFamilyContext } from "@/lib/session";
import { getCategories, getLatestRate, getRecurringBills } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { BillForm } from "./bill-form";
import { deleteBill, payBill, toggleBill } from "./actions";
import type { Currency, RecurringBill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CuentasFijasPage() {
  const { family } = await getFamilyContext();
  const [categories, bills, rate] = await Promise.all([
    getCategories(family.id),
    getRecurringBills(family.id),
    getLatestRate(family.id),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totalPyg = bills.reduce(
    (a, b) => a + (b.currency === "USD" ? Number(b.amount) * rate : Number(b.amount)),
    0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Cuentas fijas</h1>
        <p className="text-xs text-zinc-500">
          Gastos que se repiten todos los mes: alquiler, luz, internet, cable...
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">➕ Nueva cuenta fija</h2>
        <BillForm categories={categories} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">📋 Tus cuentas ({bills.length})</h2>
          <span className="text-xs text-zinc-400">~{formatMoney(totalPyg)} / mes</span>
        </div>

        {bills.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Todavía no cargaste cuentas fijas. Agregá arriba la primera 👆
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {bills.map((b: RecurringBill) => {
              const cat = b.category_id ? catMap.get(b.category_id) : undefined;
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
                    <p className="text-xs text-zinc-400">
                      📅 Día {b.due_day}
                      {cat ? ` · ${cat.name}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular">
                      {formatMoney(Number(b.amount), b.currency as Currency)}
                    </p>
                    <p className="text-[10px] text-zinc-400">por mes</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <form action={payBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        className="rounded-lg bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100"
                        title="Registrar como gasto de hoy"
                      >
                        Pagar
                      </button>
                    </form>
                    <form action={toggleBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="active" value={String(b.active)} />
                      <button className="text-[11px] text-zinc-400 hover:text-zinc-600">
                        {b.active ? "pausar" : "reactivar"}
                      </button>
                    </form>
                    <form action={deleteBill}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-[11px] text-zinc-400 hover:text-red-500">
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

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
        💡 <b>Tip:</b> tocá «Pagar» cuando cobres la factura y el gasto se registra
        automáticamente en Movimientos con la fecha de hoy.
      </p>
    </div>
  );
}
