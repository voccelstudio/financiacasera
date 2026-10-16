"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO } from "@/lib/demo/store";

export async function signIn(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  if (DEMO) {
    redirect("/app");
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá el email y la contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signUp(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  if (DEMO) {
    redirect("/app");
  }
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName) return { error: "Decinos tu nombre." };
  if (!email) return { error: "Necesitamos un email válido." };
  if (password.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // Si la confirmación de email está activada en Supabase, no hay sesión aún.
  if (!data.session) {
    return { error: "__CHECK_EMAIL__" };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  if (DEMO) {
    redirect("/app");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
