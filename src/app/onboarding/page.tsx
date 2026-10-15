"use client";

import { useActionState } from "react";
import { createFamily, joinFamily } from "./actions";

export default function OnboardingPage() {
  const [createState, createAction, createPending] = useActionState(createFamily, undefined);
  const [joinState, joinAction, joinPending] = useActionState(joinFamily, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl">
            👨‍👩‍👧‍👦
          </div>
          <h1 className="text-xl font-bold">Configurá tu familia</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Creá una familia nueva o unite a una con el código que te compartieron.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">🆕 Crear mi familia</h2>
          <form action={createAction} className="flex gap-2">
            <input
              name="family_name"
              required
              placeholder="Ej: Familia González"
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <button
              type="submit"
              disabled={createPending}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {createPending ? "..." : "Crear"}
            </button>
          </form>
          {createState?.error && (
            <p className="mt-2 text-xs text-red-600">{createState.error}</p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">🔑 Unirme con código</h2>
          <form action={joinAction} className="flex gap-2">
            <input
              name="code"
              required
              placeholder="Ej: A2B3C4"
              autoCapitalize="characters"
              maxLength={8}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-center font-mono text-sm uppercase tracking-widest outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <button
              type="submit"
              disabled={joinPending}
              className="rounded-xl border border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
            >
              {joinPending ? "..." : "Unirme"}
            </button>
          </form>
          {joinState?.error && (
            <p className="mt-2 text-xs text-red-600">{joinState.error}</p>
          )}
        </section>

        <p className="text-center text-xs text-zinc-400">
          Un solo celular puede ver todo: compartí el código para que todos participen.
        </p>
      </div>
    </main>
  );
}
