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

/** Persiste una tasa USD->PYG (demo o Supabase) y revalida las vistas. */
async function persistRate(rate: number): Promise<State> {
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

/** Guarda la tasa USD -> PYG del día (para conversiones). */
export async function saveRate(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const rate = Number(String(formData.get("rate") ?? "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Tasa inválida." };
  return persistRate(rate);
}

/** Consulta la tasa del día del Banco Central del Paraguay (sin clave). */
export async function fetchDollarRate(
  _prev: State | undefined,
  _formData: FormData
): Promise<State> {
  void _prev;
  void _formData;
  let rate: number | null = null;
  let date = "";

  // Fuente: planilla oficial del BCP, servida por AllRatesToday (sin API key)
  try {
    const res = await fetch(
      "https://allratestoday.com/api/open/central-bank/bcp?source=USD&target=PYG",
      {
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const n = Number(data?.rate);
      if (Number.isFinite(n) && n > 100 && n < 100000) {
        rate = Math.round(n * 100) / 100;
        date = String(data?.rate_date ?? "");
      }
    }
  } catch {
    // sin internet o fuente caída: se informa abajo
  }

  if (rate === null) {
    return {
      error:
        "No se pudo consultar la tasa hoy (sin internet o fuente caída). Cargala a mano 👇",
    };
  }

  const saved = await persistRate(rate);
  if (saved.error) return saved;
  return {
    ok: `Tasa del día${date ? ` (${date})` : ""}: US$ 1 = ₲ ${rate.toLocaleString("es-PY")} ✅`,
  };
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
