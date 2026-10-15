"use client";

import { useActionState, useState } from "react";
import { payDebtPlain, saveDebt } from "./actions";

export function DebtForm() {
  const [state, action, pending] = useActionState(saveDebt, undefined);

  const input =
    "w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100";

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Ej: Préstamo personal, Cuota auto"
          maxLength={60}
          className={`${input} sm:col-span-2`}
        />
        <select name="direction" defaultValue="owe" className={input}>
          <option value="owe">🔴 Debemos nosotros</option>
          <option value="lent">🔵 Nos deben a nosotros</option>
        </select>
        <input name="counterparty" placeholder="¿A quién? Ej: Banco Familiar" className={input} />
        <div className="flex gap-2">
          <input
            name="total_amount"
            inputMode="decimal"
            required
            placeholder="Monto total"
            className={`${input} flex-1 tabular`}
          />
          <select name="currency" defaultValue="PYG" className="w-24 rounded-xl border border-zinc-300 px-2 text-sm">
            <option value="PYG">PYG</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <input type="date" name="due_date" className={input} title="Fecha límite (opcional)" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar"}
      </button>
      {state?.ok && <p className="text-xs text-green-700">✅ Deuda registrada</p>}
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function PayDebtButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
      >
        Abonar
      </button>
    );
  }

  function submit(formData: FormData) {
    const value = Number(String(formData.get("pay_amount") ?? "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    setError(null);
    // El action redirige al terminar, lo que reinicia este componente.
    payDebtPlain(formData);
  }

  return (
    <form action={submit} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input
        name="pay_amount"
        inputMode="decimal"
        required
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monto"
        className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs tabular"
      />
      <button type="submit" className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white">
        OK
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-400">
        ✕
      </button>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </form>
  );
}
