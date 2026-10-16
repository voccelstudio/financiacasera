"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import { DEMO, demoDeleteBudget, demoUpsertBudget } from "@/lib/demo/store";

type State = { error?: string; ok?: boolean };

export async function saveBudget(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const categoryId = String(formData.get("category_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));

  if (!categoryId) return { error: "Elegí una categoría." };
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Elegí el mes." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresá un monto válido." };

  const { family } = await getFamilyContext();

  if (DEMO) {
    demoUpsertBudget(categoryId, month, amount);
    revalidatePath("/app");
    revalidatePath("/app/presupuestos");
    return { ok: true };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("budgets").upsert(
    {
      family_id: family.id,
      category_id: categoryId,
      month,
      amount,
    },
    { onConflict: "family_id,category_id,month" }
  );

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/presupuestos");
  return { ok: true };
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (DEMO) {
    demoDeleteBudget(id);
    revalidatePath("/app");
    revalidatePath("/app/presupuestos");
    return;
  }
  const { family } = await getFamilyContext();
  const supabase = await createClient();
  await supabase.from("budgets").delete().eq("id", id).eq("family_id", family.id);
  revalidatePath("/app");
  revalidatePath("/app/presupuestos");
}
