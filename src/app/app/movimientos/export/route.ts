import { getFamilyContext } from "@/lib/session";
import {
  getActiveMembers,
  getCategories,
  getShareDetails,
  getTransactions,
  summarize,
} from "@/lib/queries";
import { currentMonth, monthLabel, toPyg } from "@/lib/money";
import { toCsv } from "@/lib/csv";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /app/movimientos/export — descarga los movimientos filtrados en CSV (Excel) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || currentMonth();
  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";
  const member = searchParams.get("member") || "";
  const q = searchParams.get("q") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const hasRange = Boolean(from || to);

  const { family } = await getFamilyContext();

  const [categories, members, transactions] = await Promise.all([
    getCategories(family.id),
    getActiveMembers(family.id),
    getTransactions(family.id, {
      month: hasRange ? undefined : month,
      type: type === "income" || type === "expense" ? type : undefined,
      categoryId: category || undefined,
      memberId: member || undefined,
      q: q || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const memMap = new Map(members.map((m) => [m.id, m.name]));
  const shareRows = await getShareDetails(transactions.map((t) => t.id));
  const sharesByTx = new Map<string, string[]>();
  for (const s of shareRows) {
    const list = sharesByTx.get(s.transaction_id) ?? [];
    list.push(memMap.get(s.member_id) ?? s.member_id);
    sharesByTx.set(s.transaction_id, list);
  }

  const rows: (string | number)[][] = [
    ["Fecha", "Tipo", "Categoría", "Descripción", "Monto", "Moneda", "Monto (PYG)", "Participan"],
  ];
  for (const t of transactions) {
    rows.push([
      t.date,
      t.type === "income" ? "Ingreso" : "Gasto",
      t.category_id ? (catMap.get(t.category_id) ?? "") : "",
      t.description ?? "",
      String(t.amount),
      t.currency,
      String(Math.round(toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate)))),
      (sharesByTx.get(t.id) ?? []).join(", "),
    ]);
  }
  const summary = summarize(transactions);
  rows.push([]);
  rows.push(["Resumen", hasRange ? `${from} a ${to}` : monthLabel(month)]);
  rows.push(["Ingresos (PYG)", String(Math.round(summary.income))]);
  rows.push(["Gastos (PYG)", String(Math.round(summary.expense))]);
  rows.push(["Balance (PYG)", String(Math.round(summary.balance))]);

  const filename = hasRange
    ? `movimientos-${from || "inicio"}-${to || "hoy"}.csv`
    : `movimientos-${month}.csv`;
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
