"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import { getLatestRate } from "@/lib/queries";

type State = { error?: string; ok?: boolean };

export async function saveDebt(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  const direction = String(formData.get("direction") ?? "owe") === "lent" ? "lent" : "owe";
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const total = Number(String(formData.get("total_amount") ?? "").replace(",", "."));
  const currency = String(formData.get("currency") ?? "PYG") === "USD" ? "USD" : "PYG";
  const dueDate = String(formData.get("due_date") ?? "");

  if (!name) return { error: "Poné un nombre para la deuda." };
  if (!Number.isFinite(total) || total <= 0) return { error: "Monto inválido." };

  const { family } = await getFamilyContext();
  const supabase = await createClient();
  const rate = currency === "USD" ? await getLatestRate(family.id) : 1;

  const { error } = await supabase.from("debts").insert({
    family_id: family.id,
    name,
    direction,
    counterparty: counterparty || null,
    total_amount: total,
    paid_amount: 0,
    currency,
    pyg_rate: rate,
    due_date: dueDate || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/deudas");
  return { ok: true };
}

/** Registra un abono a la deuda. */
export async function payDebt(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const id = String(formData.get("id") ?? "");
  const amount = Number(String(formData.get("pay_amount") ?? "").replace(",", "."));

  if (!id) return { error: "Deuda no encontrada." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresá un monto válido." };

  const { family } = await getFamilyContext();
  const supabase = await createClient();

  const { data: debt } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!debt) return { error: "Deuda no encontrada." };

  const newPaid = Math.min(
    Number(debt.total_amount),
    Number(debt.paid_amount) + amount
  );
  const finished = newPaid >= Number(debt.total_amount);

  const { error } = await supabase
    .from("debts")
    .update({ paid_amount: newPaid, active: !finished })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/deudas");
  return { ok: true };
}

/** Versión sin estado para botón simple: redirige al terminar (reinicia la UI). */
export async function payDebtPlain(formData: FormData): Promise<void> {
  const result = await payDebt(undefined, formData);
  if (result.error) {
    // Sin forma de mostrar el error inline en esta variante: se ignora
    // (el formulario valida el monto en el cliente antes de enviar).
    console.warn("payDebt:", result.error);
  }
  revalidatePath("/app/deudas");
  revalidatePath("/app");
  redirect("/app/deudas");
}

export async function closeDebt(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { family } = await getFamilyContext();
  const supabase = await createClient();
  await supabase
    .from("debts")
    .update({ active: false })
    .eq("id", id)
    .eq("family_id", family.id);
  revalidatePath("/app/deudas");
  revalidatePath("/app");
}

export async function deleteDebt(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { family } = await getFamilyContext();
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", id).eq("family_id", family.id);
  revalidatePath("/app/deudas");
  revalidatePath("/app");
}
