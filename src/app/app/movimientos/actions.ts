"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import { getLatestRate } from "@/lib/queries";
import { DEMO, demoDeleteTransaction, demoImportTransactions, demoSaveTransaction } from "@/lib/demo/store";

type State = { error?: string };

function parseForm(formData: FormData) {
  const type = String(formData.get("type") ?? "expense");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\./g, "").replace(",", "."));
  const currency = String(formData.get("currency") ?? "PYG") === "USD" ? "USD" : "PYG";
  const date = String(formData.get("date") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const scope = String(formData.get("scope") ?? "family") === "members" ? "members" : "family";
  const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresá un monto mayor a cero." };
  if (!date) return { error: "Elegí la fecha del movimiento." };
  if (scope === "members" && memberIds.length === 0)
    return { error: "Seleccioná al menos un miembro de la familia." };

  return { type, amount, currency, date, categoryId, description, scope, memberIds };
}

export async function saveTransaction(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed as State;

  const id = String(formData.get("id") ?? "");
  const { family } = await getFamilyContext();
  const supabase = await createClient();

  const pygRate =
    parsed.currency === "USD" ? await getLatestRate(family.id) : 1;

  if (DEMO) {
    demoSaveTransaction(
      {
        id: id || undefined,
        type: parsed.type as "income" | "expense",
        amount: parsed.amount,
        currency: parsed.currency as "PYG" | "USD",
        date: parsed.date,
        categoryId: parsed.categoryId,
        description: parsed.description,
        scope: parsed.scope as "family" | "members",
        memberIds: parsed.memberIds,
      },
      pygRate
    );
    revalidatePath("/app");
    revalidatePath("/app/movimientos");
    revalidatePath("/app/reportes");
    redirect("/app/movimientos");
  }

  const payload = {
    family_id: family.id,
    type: parsed.type,
    amount: parsed.amount,
    currency: parsed.currency,
    pyg_rate: pygRate,
    category_id: parsed.categoryId || null,
    description: parsed.description || null,
    date: parsed.date,
    scope: parsed.scope,
  };

  let txId = id;

  if (id) {
    const { error } = await supabase.from("transactions").update(payload).eq("id", id);
    if (error) return { error: error.message };
    await supabase.from("transaction_members").delete().eq("transaction_id", id);
  } else {
    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    txId = data.id as string;
  }

  if (parsed.scope === "members") {
    const share = Math.round((parsed.amount / parsed.memberIds.length) * 100) / 100;
    const rows = parsed.memberIds.map((member_id, i) => ({
      transaction_id: txId,
      member_id,
      // Ajuste de centavos en el último para que la suma sea exacta
      amount:
        i === parsed.memberIds.length - 1
          ? Math.round((parsed.amount - share * (parsed.memberIds.length - 1)) * 100) / 100
          : share,
    }));
    const { error } = await supabase.from("transaction_members").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/movimientos");
  revalidatePath("/app/reportes");
  redirect("/app/movimientos");
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { family } = await getFamilyContext();
  if (DEMO) {
    demoDeleteTransaction(id);
    revalidatePath("/app");
    revalidatePath("/app/movimientos");
    revalidatePath("/app/reportes");
    return;
  }
  const supabase = await createClient();
  await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("family_id", family.id);
  revalidatePath("/app");
  revalidatePath("/app/movimientos");
  revalidatePath("/app/reportes");
}

type ImportState = { error?: string; ok?: string };

/** Importa de una sola vez los movimientos parseados de un extracto bancario. */
export async function importTransactions(
  _prev: ImportState | undefined,
  formData: FormData
): Promise<ImportState> {
  const raw = String(formData.get("rows") ?? "[]");
  let rows: {
    type: string;
    amount: number;
    currency: string;
    date: string;
    categoryId: string;
    description: string;
  }[];
  try {
    rows = JSON.parse(raw);
  } catch {
    return { error: "Los datos a importar están corruptos. Probá de nuevo." };
  }
  if (!Array.isArray(rows) || rows.length === 0)
    return { error: "No hay movimientos para importar." };
  if (rows.length > 500)
    return { error: `Máximo 500 movimientos por importación (vinieron ${rows.length}).` };

  const invalid = rows.find(
    (r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(Number(r.amount)) || Number(r.amount) <= 0
  );
  if (invalid) return { error: "Hay filas con fecha o monto inválido." };

  const { family, userId } = await getFamilyContext();
  const rate = await getLatestRate(family.id);

  if (DEMO) {
    demoImportTransactions(
      rows.map((r) => ({
        type: r.type === "income" ? ("income" as const) : ("expense" as const),
        amount: Number(r.amount),
        currency: r.currency === "USD" ? ("USD" as const) : ("PYG" as const),
        date: r.date,
        categoryId: r.categoryId,
        description: r.description,
      })),
      rate
    );
    revalidatePath("/app");
    revalidatePath("/app/movimientos");
    revalidatePath("/app/reportes");
    return { ok: `${rows.length} movimientos importados ✅` };
  }

  const supabase = await createClient();
  const payload = rows.map((r) => ({
    family_id: family.id,
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount),
    currency: r.currency === "USD" ? "USD" : "PYG",
    pyg_rate: r.currency === "USD" ? rate : 1,
    category_id: r.categoryId || null,
    description: r.description || null,
    date: r.date,
    scope: "family",
    created_by: userId,
  }));

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/movimientos");
  revalidatePath("/app/reportes");
  return { ok: `${rows.length} movimientos importados ✅` };
}
