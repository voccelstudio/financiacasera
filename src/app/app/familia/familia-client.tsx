"use client";

import { useActionState, useState } from "react";
import { addMember, removeMember, rotateInviteCode } from "./actions";
import type { FamilyMember } from "@/lib/types";

export function InviteCode({ code, familyName }: { code: string; familyName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Sin permiso de clipboard: mostramos el código para copiarlo a mano
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function rotate() {
    if (confirm("Generar un código nuevo. El anterior dejará de funcionar. ¿Seguro?")) {
      // Recargamos la página tras rotar para ver el código nuevo
      await rotateInviteCode();
      window.location.reload();
    }
  }

  return (
    <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-4 text-center">
      <p className="text-xs text-green-700 dark:text-green-300">Código para unir gente a {familyName}</p>
      <p className="my-2 font-mono text-3xl font-bold tracking-[0.3em] text-green-800 dark:text-green-200">
        {code}
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={copy}
          className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
        >
          {copied ? "✅ Copiado" : "📋 Copiar código"}
        </button>
        <button
          onClick={rotate}
          className="rounded-xl border border-green-300 dark:border-green-700 px-4 py-2 text-xs text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
        >
          🔁 Nuevo código
        </button>
      </div>
      <p className="mt-2 text-[11px] text-green-600 dark:text-green-400">
        El otro debe ingresar a la app y elegir «Unirme con código».
      </p>
    </div>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, undefined);
  const [name, setName] = useState("");

  const success = state?.ok && !state.error;

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input
        name="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre (Ej: Juan, Sofi, Miguelito)"
        maxLength={40}
        className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "..." : "Agregar"}
      </button>
      {success && (
        <p className="w-full text-xs text-green-700 dark:text-green-300">
          {state?.ok} — <button type="button" className="underline" onClick={() => setName("")}>agregar otro</button>
        </p>
      )}
      {state?.error && !success && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}

export function RemoveMemberDialog({ member }: { member: FamilyMember }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(removeMember, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 dark:hover:text-red-400"
      >
        quitar
      </button>
    );
  }

  // Al terminar con éxito, el servidor revalida y el miembro desaparece
  // de la lista activa → este componente se desmonta solo.

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="dialog-in w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-xl">
        <h3 className="text-sm font-bold">Quitar a {member.name} de la familia</h3>
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="member_id" value={member.id} />

          <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-950">
            <input type="radio" name="mode" value="archive" defaultChecked className="mt-0.5" />
            <span className="text-sm">
              <b>Archivar (recomendado)</b>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                Se va de la familia pero su historial de gastos se conserva. Ideal para
                separaciones: los gastos familiares compartidos siguen intactos.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-950">
            <input type="radio" name="mode" value="delete" className="mt-0.5" />
            <span className="text-sm">
              <b>Eliminar del todo</b>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                Además borra sus gastos personales (los que le correspondían solo a él/ella).
                Los gastos de la familia en general no se tocan.
              </span>
            </span>
          </label>

          {state?.error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Procesando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
