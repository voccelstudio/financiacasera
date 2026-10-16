"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import { getLatestRate } from "@/lib/queries";
import {
  DEMO,
  demoContribute,
  demoCreateGoal,
  demoDeleteContribution,
  demoDeleteGoal,
} from "@/lib/demo/store";

type State = { error?: string; ok?: string };

/** Crea una meta de ahorro. */
export async function createGoal(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();
  const target = Number(
    String(formData.get("target") ?? "").replace(/\./g, "").replace(",", ".")
  );
  const currency =
    String(formData.get("currency") ?? "PYG") === "USD" ? "USD" : "PYG";
  const deadline = String(formData.get("deadline") ?? "");

  if (!name) return { error: "Poné un nombre para la meta (Ej: Heladera nueva)." };
  if (!Number.isFinite(target) || target <= 0)
    return { error: "Ingresá el monto objetivo mayor a cero." };

  if (DEMO) {
    demoCreateGoal({ name, emoji, target, currency, deadline }, await getLatestRate("demo-family"));
    revalidatePath("/app");
    revalidatePath("/app/metas");
    return { ok: `Meta «${name}» creada 🎯` };
  }

  const { family, userId } = await getFamilyContext();
  const rate = currency === "USD" ? await getLatestRate(family.id) : 1;
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").insert({
    family_id: family.id,
    name,
    emoji: emoji || "🎯",
    target_amount: target,
    currency,
    pyg_rate: rate,
    deadline: deadline || null,
    archived: false,
    created_by: userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/metas");
  return { ok: `Meta «${name}» creada 🎯` };
}

/** Suma un aporte a una meta. */
export async function contributeToGoal(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const goalId = String(formData.get("goal_id") ?? "");
  const amount = Number(
    String(formData.get("amount") ?? "").replace(/\./g, "").replace(",", ".")
  );
  const memberId = String(formData.get("member_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);

  if (!goalId) return { error: "Meta inválida." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Ingresá un aporte mayor a cero." };

  if (DEMO) {
    const err = demoContribute(
      { goalId, amount, memberId, note, date },
      await getLatestRate("demo-family")
    );
    if (err) return { error: err };
    revalidatePath("/app");
    revalidatePath("/app/metas");
    return { ok: `¡Aporte guardado! 💰` };
  }

  const { family } = await getFamilyContext();
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("currency")
    .eq("id", goalId)
    .eq("family_id", family.id)
    .maybeSingle();
  if (!goal) return { error: "Meta no encontrada." };

  const currency = goal.currency as "PYG" | "USD";
  const rate = currency === "USD" ? await getLatestRate(family.id) : 1;

  const { error } = await supabase.from("goal_contributions").insert({
    goal_id: goalId,
    family_id: family.id,
    member_id: memberId || null,
    amount,
    currency,
    pyg_rate: rate,
    note: note || null,
    date,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/metas");
  return { ok: "¡Aporte guardado! 💰" };
}

/** Elimina una meta (y sus aportes). */
export async function deleteGoal(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (DEMO) {
    demoDeleteGoal(id);
  } else {
    const { family } = await getFamilyContext();
    const supabase = await createClient();
    await supabase.from("goal_contributions").delete().eq("goal_id", id).eq("family_id", family.id);
    await supabase.from("savings_goals").delete().eq("id", id).eq("family_id", family.id);
  }
  revalidatePath("/app");
  revalidatePath("/app/metas");
}

/** Elimina un aporte (para corregir errores de carga). */
export async function deleteContribution(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const goalId = String(formData.get("goal_id") ?? "");
  if (!id) return;
  if (DEMO) {
    demoDeleteContribution(id);
  } else {
    const { family } = await getFamilyContext();
    const supabase = await createClient();
    await supabase
      .from("goal_contributions")
      .delete()
      .eq("id", id)
      .eq("family_id", family.id);
  }
  if (goalId) revalidatePath("/app/metas");
  revalidatePath("/app");
}
