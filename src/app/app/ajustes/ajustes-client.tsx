"use client";

import { useActionState } from "react";
import { leaveFamily, renameFamily, saveProfileName, saveRate } from "./actions";

type Result = { error?: string; ok?: string };

const input =
  "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900";

function Feedback({ state }: { state: Result | undefined }) {
  if (state?.ok) return <p className="text-xs text-green-700 dark:text-green-300">{state.ok}</p>;
  if (state?.error) return <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>;
  return null;
}

export function RateForm({ defaultRate }: { defaultRate: number }) {
  const [state, action, pending] = useActionState(saveRate, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="rate"
          inputMode="decimal"
          required
          defaultValue={defaultRate}
          placeholder="7300"
          className={`${input} flex-1 tabular`}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "..." : "Guardar"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function FamilyNameForm({
  initialName,
  canEdit,
}: {
  initialName: string;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(renameFamily, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" required defaultValue={initialName} className={`${input} flex-1`} />
        <button
          type="submit"
          disabled={pending || !canEdit}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 disabled:opacity-50"
        >
          {pending ? "..." : "Cambiar"}
        </button>
      </div>
      {!canEdit && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Solo el admin de la familia puede cambiarlo.
        </p>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(saveProfileName, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="full_name"
          required
          defaultValue={initialName}
          className={`${input} flex-1`}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
        >
          {pending ? "..." : "Guardar"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function LeaveFamilyButton({ familyName }: { familyName: string }) {
  return (
    <form
      action={leaveFamily}
      onSubmit={(e) => {
        if (!confirm("¿Seguro que querés salir de la familia?")) e.preventDefault();
      }}
    >
      <button className="rounded-xl border border-red-300 dark:border-red-700 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
        Salir de {familyName}
      </button>
    </form>
  );
}
