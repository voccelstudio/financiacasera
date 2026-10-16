"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { importTransactions } from "../actions";
import { extractMovements, parseDelimited, type ParsedMovement } from "@/lib/csv";
import { formatMoney } from "@/lib/money";
import type { Category } from "@/lib/types";

type PreviewRow = ParsedMovement & { categoryId: string; key: number };

/** Asigna una categoría por palabras clave del banco (se puede cambiar después) */
function guessCategory(m: ParsedMovement, categories: Category[]): string {
  const rules: [RegExp, RegExp, "income" | "expense"][] = [
    [/ande|luz|electricidad/i, /luz/i, "expense"],
    [/essap|agua/i, /agua/i, "expense"],
    [/internet|fibra|tigo|claro.*net|wifi/i, /internet/i, "expense"],
    [/nafta|gasolina|combustible|petropar/i, /gasolina/i, "expense"],
    [/mercado|supermercado|carrefour|tesai|metropolitano|verduler/i, /mercado/i, "expense"],
    [/garrafa|\bgas\b/i, /gas/i, "expense"],
    [/alquiler/i, /alquiler/i, "expense"],
    [/cuota escolar|colegio|mensualidad/i, /educaci/i, "expense"],
    [/sueldo|n[oó]mina|salario/i, /sueldo/i, "income"],
    [/venta/i, /venta/i, "income"],
    [/bono|beneficio|aguinaldo/i, /bono/i, "income"],
  ];
  for (const [descRe, catRe, type] of rules) {
    if (m.type !== type) continue;
    if (descRe.test(m.description)) {
      const cat = categories.find((c) => c.type === type && catRe.test(c.name));
      if (cat) return cat.id;
    }
  }
  return "";
}

export function ImportClient({ categories }: { categories: Category[] }) {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [state, action, pending] = useActionState(importTransactions, undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);

  const load = (text: string, name?: string) => {
    const parsed = parseDelimited(text);
    const { movements, skipped } = extractMovements(parsed);
    setRows(
      movements.map((m) => ({
        ...m,
        categoryId: guessCategory(m, categories),
        key: nextKey.current++,
      }))
    );
    setSkipped(skipped);
    setSourceName(name ?? "");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) f.text().then((t) => load(t, f.name));
  };

  const onPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.trim().length > 20) load(text, "texto pegado");
  };

  const removeRow = (key: number) => setRows((r) => r.filter((x) => x.key !== key));
  const setCat = (key: number, categoryId: string) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, categoryId } : x)));

  const totals = rows.reduce(
    (acc, r) => {
      if (r.type === "income") acc.in += 1;
      else acc.out += 1;
      return acc;
    },
    { in: 0, out: 0 }
  );

  const payload = JSON.stringify(
    rows.map((r) => ({
      type: r.type,
      amount: r.amount,
      currency: r.currency,
      date: r.date,
      categoryId: r.categoryId,
      description: r.description,
    }))
  );

  const done = Boolean(state?.ok);

  return (
    <div className="space-y-4">
      {/* Origen de datos */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <div>
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-6 text-center hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-semibold">
              {sourceName ? sourceName : "Elegir archivo CSV"}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              .csv / .txt de tu banco
            </span>
          </label>
          <input
            id="csv-file"
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.tsv,text/csv,text/plain"
            onChange={onFile}
            className="sr-only"
          />
        </div>
        <div>
          <textarea
            rows={3}
            onChange={onPaste}
            placeholder="…o pegá acá las filas del extracto: fecha; descripción; monto"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs font-mono outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900"
          />
        </div>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand-50 dark:bg-brand-950 px-2.5 py-1 font-semibold text-brand-700 dark:text-brand-300">
              {rows.length} movimientos detectados
            </span>
            {totals.in > 0 && (
              <span className="rounded-full bg-green-50 dark:bg-green-950 px-2.5 py-1 text-green-700 dark:text-green-300">
                {totals.in} ingresos
              </span>
            )}
            {totals.out > 0 && (
              <span className="rounded-full bg-red-50 dark:bg-red-950 px-2.5 py-1 text-red-600 dark:text-red-400">
                {totals.out} gastos
              </span>
            )}
            {skipped > 0 && (
              <span className="text-zinc-400 dark:text-zinc-500">
                {skipped} fila{skipped === 1 ? "" : "s"} sin fecha/monto se saltearon
              </span>
            )}
            <button
              onClick={() => {
                setRows([]);
                setSkipped(0);
                setSourceName("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="ml-auto text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              vaciar
            </button>
          </div>
        )}
      </section>

      {/* Vista previa */}
      {rows.length > 0 && !done && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-bold">👀 Revisá antes de importar</h2>
          <ul className="max-h-80 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2 py-2">
                <span className="w-16 shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500 tabular">
                  {r.date.slice(5).split("-").reverse().join("/")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{r.description}</p>
                  <select
                    value={r.categoryId}
                    onChange={(e) => setCat(r.key, e.target.value)}
                    className="mt-0.5 max-w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 text-[11px] outline-none focus:border-brand-600"
                  >
                    <option value="">Sin categoría</option>
                    {categories
                      .filter((c) => c.type === r.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold tabular ${
                    r.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {r.type === "income" ? "+" : "−"}
                  {formatMoney(r.amount, r.currency)}
                </span>
                <button
                  onClick={() => removeRow(r.key)}
                  aria-label="Quitar de la importación"
                  className="shrink-0 rounded px-1.5 py-1 text-xs text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <form action={action} className="mt-4">
            <input type="hidden" name="rows" value={payload} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending
                ? "Importando…"
                : `Importar ${rows.length} movimiento${rows.length === 1 ? "" : "s"}`}
            </button>
            {state?.error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
            )}
          </form>
        </section>
      )}

      {/* Éxito */}
      {done && (
        <section className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-6 text-center">
          <p className="text-3xl">✅</p>
          <p className="mt-2 text-sm font-bold text-green-800 dark:text-green-200">
            {state?.ok}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/app/movimientos"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ver movimientos →
            </Link>
            <button
              onClick={() => {
                setRows([]);
                setSkipped(0);
                setSourceName("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900"
            >
              Importar otro
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
