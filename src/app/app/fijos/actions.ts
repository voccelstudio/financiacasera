"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import { getLatestRate } from "@/lib/queries";
import {
  DEMO,
  demoDeleteBill,
  demoPayBill,
  demoSaveBill,
  demoToggleBill,
} from "@/lib/demo/store";

type State = { error?: string; ok?: boolean };

export async function saveBill(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const currency = String(formData.get("currency") ?? "PYG") === "USD" ? "USD" : "PYG";
  const dueDay = Number(formData.get("due_day") ?? 1);
  const categoryId = String(formData.get("category_id") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!name) return { error: "Poné un nombre (Ej: Luz ANDE)." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Monto inválido." };
  if (dueDay < 1 || dueDay > 31) return { error: "Día entre 1 y 31." };

  const { family } = await getFamilyContext();
  const rate = currency === "USD" ? await getLatestRate(family.id) : 1;

  if (DEMO) {
    demoSaveBill(
      { id: id || undefined, name, amount, currency: currency as "PYG" | "USD", dueDay, categoryId },
      rate
    );
    revalidatePath("/app");
    revalidatePath("/app/fijos");
    return { ok: true };
  }

  const supabase = await createClient();

  const payload = {
    family_id: family.id,
    name,
    amount,
    currency,
    pyg_rate: rate,
    due_day: dueDay,
    category_id: categoryId || null,
  };

  const { error } = id
    ? await supabase.from("recurring_bills").update(payload).eq("id", id)
    : await supabase.from("recurring_bills").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/fijos");
  return { ok: true };
}

export async function toggleBill(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";
  if (DEMO) {
    demoToggleBill(id);
    revalidatePath("/app/fijos");
    revalidatePath("/app");
    return;
  }
  const { family } = await getFamilyContext();
  const supabase = await createClient();
  await supabase
    .from("recurring_bills")
    .update({ active: !active })
    .eq("id", id)
    .eq("family_id", family.id);
  revalidatePath("/app/fijos");
  revalidatePath("/app");
}

/** Registra el pago de una cuenta fija como gasto del mes actual. */
export async function payBill(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (DEMO) {
    demoPayBill(id);
    revalidatePath("/app");
    revalidatePath("/app/fijos");
    revalidatePath("/app/movimientos");
    return;
  }
  const { family, userId } = await getFamilyContext();
  const supabase = await createClient();

  const { data: bill } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("id", id)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!bill) return;

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("transactions").insert({
    family_id: family.id,
    type: "expense",
    amount: Number(bill.amount),
    currency: bill.currency,
    pyg_rate: Number(bill.pyg_rate),
    category_id: bill.category_id,
    description: `Pago: ${bill.name}`,
    date: today,
    scope: "family",
    created_by: userId,
  });

  if (!error) {
    revalidatePath("/app");
    revalidatePath("/app/fijos");
    revalidatePath("/app/movimientos");
  }
}

export async function deleteBill(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (DEMO) {
    demoDeleteBill(id);
    revalidatePath("/app/fijos");
    revalidatePath("/app");
    return;
  }
  const { family } = await getFamilyContext();
  const supabase = await createClient();
  await supabase.from("recurring_bills").delete().eq("id", id).eq("family_id", family.id);
  revalidatePath("/app/fijos");
  revalidatePath("/app");
}
