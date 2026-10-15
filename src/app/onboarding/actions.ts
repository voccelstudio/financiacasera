"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createFamily(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const name = String(formData.get("family_name") ?? "").trim();
  if (!name) return { error: "Poné un nombre para la familia." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_family", { p_name: name });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(`/app?bienvenida=${encodeURIComponent((data as { name: string }).name)}`);
}

export async function joinFamily(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const code = String(formData.get("code") ?? "").trim();
  if (code.length < 4) return { error: "El código tiene al menos 4 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_family", { p_code: code });

  if (error) {
    return {
      error: error.message.includes("Código inválido")
        ? "No encontramos ninguna familia con ese código."
        : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
