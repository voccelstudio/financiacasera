"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { saveTransaction } from "@/app/app/movimientos/actions";
import type { Category, Currency, FamilyMember, Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/money";

interface Props {
  categories: Category[];
  members: FamilyMember[];
  defaultRate: number;
  transaction?: Transaction & { shares?: { member_id: string }[] };
  initialMemberIds?: string[];
}

const input =
  "w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100";

export function TransactionForm({ categories, members, defaultRate, transaction, initialMemberIds = [] }: Props) {
  const [state, action, pending] = useActionState(saveTransaction, undefined);
  const [type, setType] = useState<"income" | "expense">(transaction?.type ?? "expense");
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? "PYG");
  const [scope, setScope] = useState<"family" | "members">(
    transaction?.scope ?? (initialMemberIds.length ? "members" : "family")
  );
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialMemberIds);

  const filtered = categories.filter((c) => c.type === type);
  const numericAmount = Number(amount.replace(/\./g, "").replace(",", ".")) || 0;
  const rate = currency === "USD" ? defaultRate : 1;

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  return (
    <form action={action} className="space-y-4">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="scope" value={scope} />
      {selectedMembers.map((id) => (
        <input key={id} type="hidden" name="member_ids" value={id} />
      ))}

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              type === t
                ? t === "expense"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-green-300 bg-green-50 text-green-700"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            {t === "expense" ? "💸 Gasto" : "💰 Ingreso"}
          </button>
        ))}
      </div>

      {/* Monto + moneda */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Monto</label>
        <div className="flex gap-2">
          <input
            name="amount"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={currency === "USD" ? "100.00" : "150000"}
            className={`${input} flex-1 text-lg font-semibold tabular`}
          />
          <div className="flex overflow-hidden rounded-xl border border-zinc-300">
            {(["PYG", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-3 text-xs font-bold ${
                  currency === c ? "bg-green-600 text-white" : "bg-white text-zinc-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {currency === "USD" && (
          <p className="mt-1 text-[11px] text-zinc-400">
            Se convierte a ₲ al valor de la tasa registrada:{" "}
            <span className="tabular">{formatMoney(rate)}</span> por US$ 1
          </p>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Categoría</label>
        <select name="category_id" defaultValue={transaction?.category_id ?? ""} className={input}>
          <option value="">Sin categoría</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Fecha</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={transaction?.date ?? new Date().toISOString().slice(0, 10)}
          className={input}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Descripción (opcional)</label>
        <input
          name="description"
          defaultValue={transaction?.description ?? ""}
          placeholder="Ej: Juntada del mercado en Trinidad"
          maxLength={120}
          className={input}
        />
      </div>

      {/* Alcance: familia o miembros */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">¿A quién corresponde?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScope("family")}
            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
              scope === "family"
                ? "border-green-300 bg-green-50 font-semibold text-green-700"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            👨‍👩‍👧 Familia
          </button>
          <button
            type="button"
            onClick={() => setScope("members")}
            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
              scope === "members"
                ? "border-green-300 bg-green-50 font-semibold text-green-700"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            🎯 Miembros
          </button>
        </div>

        {scope === "members" && (
          <div className="mt-2 space-y-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-[11px] text-zinc-500">
              Se divide en partes iguales entre los seleccionados:
            </p>
            {members.map((m) => {
              const checked = selectedMembers.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(m.id)}
                      className="h-4 w-4 accent-green-600"
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.name}
                  </span>
                  {checked && selectedMembers.length > 0 && (
                    <span className="text-xs tabular text-zinc-500">
                      {formatMoney(
                        numericAmount / selectedMembers.length,
                        currency
                      )}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Guardando..." : transaction ? "Guardar cambios" : "Guardar movimiento"}
        </button>
        <Link
          href="/app/movimientos"
          className="rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
