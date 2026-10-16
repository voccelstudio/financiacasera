"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import {
  DEMO,
  demoRenameFamily,
  demoSaveRate,
  demoUpdateProfile,
} from "@/lib/demo/store";

type State = { error?: string; ok?: string };

/** Guarda la tasa USD -> PYG del día (para conversiones). */
export async function saveRate(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const rate = Number(String(formData.get("rate") ?? "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Tasa inválida." };

  if (DEMO) {
    demoSaveRate(rate);
    revalidatePath("/app");
    revalidatePath("/app/ajustes");
    return { ok: `Tasa guardada: US$ 1 = ₲ ${rate.toLocaleString("es-PY")}` };
  }

  const { family } = await getFamilyContext();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("fx_rates")
    .upsert({ family_id: family.id, day: today, rate }, { onConflict: "family_id,day" });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/ajustes");
  return { ok: `Tasa guardada: US$ 1 = ₲ ${rate.toLocaleString("es-PY")}` };
}

/** Cambia el nombre de la familia (solo admin). */
export async function renameFamily(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre no puede estar vacío." };

  if (DEMO) {
    demoRenameFamily(name);
    revalidatePath("/", "layout");
    return { ok: "Nombre actualizado ✅" };
  }

  const { family } = await getFamilyContext();
  const supabase = await createClient();

  const { error } = await supabase.from("families").update({ name }).eq("id", family.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: "Nombre actualizado ✅" };
}

/** Sale de la familia (conserva el historial; se puede volver a unir con código). */
export async function leaveFamily(): Promise<void> {
  if (DEMO) {
    // En modo demo no hay a dónde salir: volvemos al resumen
    redirect("/app");
  }
  const supabase = await createClient();
  await supabase.rpc("leave_family");
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/** Cambia el nombre del perfil. */
export async function saveProfileName(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Poné tu nombre." };

  if (DEMO) {
    demoUpdateProfile(fullName);
    revalidatePath("/app/ajustes");
    return { ok: "Nombre guardado ✅" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName });
  if (error) return { error: error.message };

  revalidatePath("/app/ajustes");
  return { ok: "Nombre guardado ✅" };
}
