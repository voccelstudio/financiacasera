"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamilyContext } from "@/lib/session";
import {
  DEMO,
  demoAddMember,
  demoRemoveMember,
  demoRotateInvite,
} from "@/lib/demo/store";

type State = { error?: string; ok?: string };

const PALETTE = ["#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#0ea5e9", "#f97316"];

/** Agrega un miembro sin cuenta de acceso (ej: niños o pareja sin login). */
export async function addMember(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Poné el nombre del miembro." };

  if (DEMO) {
    demoAddMember(name);
    revalidatePath("/app/familia");
    revalidatePath("/app");
    return { ok: `"${name}" fue agregado a la familia 👨‍👩‍👧` };
  }

  const { family } = await getFamilyContext();
  const supabase = await createClient();

  const { count } = await supabase
    .from("family_members")
    .select("id", { count: "exact", head: true })
    .eq("family_id", family.id);

  const color = PALETTE[(count ?? 0) % PALETTE.length];

  const { error } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: null,
    name,
    color,
    role: "member",
  });

  if (error) return { error: error.message };

  revalidatePath("/app/familia");
  revalidatePath("/app");
  return { ok: `"${name}" fue agregado a la familia 👨‍👩‍👧` };
}

export interface RemoveMemberInput {
  memberId: string
  mode: "archive" | "delete"
}

/**
 * Quita un miembro de la familia.
 * - 'archive': conserva el historial de gastos, el miembro queda inactivo.
 * - 'delete': además borra sus gastos personales (los asignados solo a miembros)
 *   y limpia sus repartos.
 */
export async function removeMember(
  _prev: State | undefined,
  formData: FormData
): Promise<State> {
  const memberId = String(formData.get("member_id") ?? "");
  const mode = String(formData.get("mode") ?? "archive") === "delete" ? "delete" : "archive";
  if (!memberId) return { error: "Miembro no encontrado." };

  if (DEMO) {
    const target = demoRemoveMember(memberId, mode);
    if (!target) return { error: "Miembro no encontrado." };
    revalidatePath("/app/familia");
    revalidatePath("/app");
    return {
      ok:
        mode === "delete"
          ? `"${target}" fue eliminado y sus gastos personales borrados.`
          : `"${target}" ya no es parte de la familia. Su historial se conserva.`,
    };
  }

  const { family, membership } = await getFamilyContext();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", memberId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!member) return { error: "Miembro no encontrado." };

  if (mode === "delete") {
    // 1. IDs de movimientos donde participa el miembro
    const { data: shares } = await supabase
      .from("transaction_members")
      .select("transaction_id")
      .eq("member_id", memberId);
    const txIds = (shares ?? []).map((s) => s.transaction_id);

    // 2. Borrar los repartos del miembro (cascade manual)
    await supabase.from("transaction_members").delete().eq("member_id", memberId);

    // 3. Los movimientos de alcance 'members' que quedaron sin reparto se borran
    if (txIds.length > 0) {
      const { data: remaining } = await supabase
        .from("transaction_members")
        .select("transaction_id")
        .in("transaction_id", txIds);
      const stillShared = new Set((remaining ?? []).map((r) => r.transaction_id));
      const orphanTx = txIds.filter((id) => !stillShared.has(id));

      if (orphanTx.length > 0) {
        // Solo borrar los que son de alcance 'members' (los 'family' se conservan)
        await supabase
          .from("transactions")
          .delete()
          .in("id", orphanTx)
          .eq("scope", "members")
          .eq("family_id", family.id);
      }
    }
  }

  // 4. Archivar al miembro (historial conservado, ya no aparece en listas)
  const { error } = await supabase
    .from("family_members")
    .update({ active: false, left_at: new Date().toISOString(), user_id: null })
    .eq("id", memberId)
    .eq("family_id", family.id);

  if (error) return { error: error.message };

  // 5. Si era el último admin, promover al miembro activo más antiguo
  const { data: activeAdmins } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", family.id)
    .eq("active", true)
    .eq("role", "admin");

  if (!activeAdmins?.length) {
    const { data: next } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", family.id)
      .eq("active", true)
      .order("joined_at")
      .limit(1);
    if (next?.[0]) {
      await supabase
        .from("family_members")
        .update({ role: "admin" })
        .eq("id", next[0].id);
    }
  }

  // Si el usuario se quitó a sí mismo, volvemos al onboarding
  if (memberId === membership.id) {
    revalidatePath("/", "layout");
    return { ok: "__SELF_REMOVED__" };
  }

  revalidatePath("/app/familia");
  revalidatePath("/app");
  return {
    ok:
      mode === "delete"
        ? `"${member.name}" fue eliminado y sus gastos personales borrados.`
        : `"${member.name}" ya no es parte de la familia. Su historial se conserva.`,
  };
}

/** Regenera el código de invitación (por si lo compartieron demasiado). */
export async function rotateInviteCode(): Promise<void> {
  if (DEMO) {
    demoRotateInvite();
    revalidatePath("/app/familia");
    return;
  }

  const { family } = await getFamilyContext();
  const supabase = await createClient();

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await supabase.rpc("gen_invite_code");
    if (!data) continue;
    const { error } = await supabase
      .from("families")
      .update({ invite_code: data })
      .eq("id", family.id);
    if (!error) {
      code = data;
      break;
    }
  }
  if (code) revalidatePath("/app/familia");
}
