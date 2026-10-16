import { getFamilyContext } from "@/lib/session";
import { getDebts, getLatestRate } from "@/lib/queries";
import { formatMoney, toPyg } from "@/lib/money";
import { DebtForm, PayDebtButton } from "./debt-form";
import { closeDebt, deleteDebt } from "./actions";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DeudasPage() {
  const { family } = await getFamilyContext();

  const [debts, rate] = await Promise.all([
    getDebts(family.id),
    getLatestRate(family.id),
  ]);
  const active = debts.filter((d) => d.active);
  const closed = debts.filter((d) => !d.active);

  const owedTotal = active
    .filter((d) => d.direction === "owe")
    .reduce(
      (a, d) =>
        a +
        toPyg(
          Number(d.total_amount) - Number(d.paid_amount),
          d.currency as Currency,
          Number(d.pyg_rate)
        ),
      0
    );
  const lentTotal = active
    .filter((d) => d.direction === "lent")
    .reduce(
      (a, d) =>
        a +
        toPyg(
          Number(d.total_amount) - Number(d.paid_amount),
          d.currency as Currency,
          Number(d.pyg_rate)
        ),
      0
    );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Cuentas por pagar</h1>
        <p className="text-xs text-zinc-500">Préstamos, cuotas y créditos en curso.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-xs text-red-500">Debemos</p>
          <p className="text-lg font-bold text-red-600 tabular">{formatMoney(owedTotal)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs text-blue-500">Nos deben</p>
          <p className="text-lg font-bold text-blue-600 tabular">{formatMoney(lentTotal)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">➕ Nueva deuda</h2>
        <DebtForm />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">En curso ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-xs text-zinc-400">¡No tenés deudas activas! 🎉</p>
        ) : (
          <div className="space-y-3">
            {active.map((d) => {
              const total = Number(d.total_amount);
              const paid = Number(d.paid_amount);
              const pct = Math.min(100, Math.round((paid / total) * 100));
              const remaining = toPyg(
                total - paid,
                d.currency as Currency,
                Number(d.pyg_rate)
              );
              const isOwe = d.direction === "owe";
              return (
                <div key={d.id} className="rounded-xl border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {isOwe ? "🔴" : "🔵"} {d.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {isOwe ? "Debemos" : "Nos deben"}
                        {d.counterparty ? ` · ${d.counterparty}` : ""}
                        {d.due_date
                          ? ` · vence ${new Date(d.due_date + "T12:00:00").toLocaleDateString("es-PY")}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular">
                        {formatMoney(remaining)}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        de {formatMoney(toPyg(total, d.currency as Currency, Number(d.pyg_rate)))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${isOwe ? "bg-red-400" : "bg-blue-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 tabular">
                      {pct}% pagado · tasa ₲ {Number(d.pyg_rate).toLocaleString("es-PY")}
                    </span>
                    <div className="flex items-center gap-2">
                      <PayDebtButton id={d.id} />
                      <form action={closeDebt}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-[11px] text-zinc-400 hover:text-zinc-600">
                          marcar saldada
                        </button>
                      </form>
                      <form action={deleteDebt}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-[11px] text-zinc-400 hover:text-red-500">
                          eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Saldadas ({closed.length})</h2>
          <ul className="space-y-1 text-xs text-zinc-500">
            {closed.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span>✅ {d.name}</span>
                <span className="tabular">
                  {formatMoney(Number(d.total_amount), d.currency as Currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
        💡 <b>Tip:</b> registrá cada abono con «Abonar» para ver cuánto te falta de cada
        deuda. Tocá «marcar saldada» cuando la termines de pagar.
      </p>
      <p className="text-[10px] text-zinc-300">Tasa de referencia: ₲ {rate.toLocaleString("es-PY")}</p>
    </div>
  );
}
