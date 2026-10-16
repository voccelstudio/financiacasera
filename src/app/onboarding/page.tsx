"use client";

import { useActionState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createFamily, joinFamily } from "./actions";

export default function OnboardingPage() {
  const [createState, createAction, createPending] = useActionState(createFamily, undefined);
  const [joinState, joinAction, joinPending] = useActionState(joinFamily, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl">
            👨‍👩‍👧‍👦
          </div>
          <h1 className="text-xl font-bold">Configurá tu familia</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Creá una familia nueva o unite a una con el código que te compartieron.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">🆕 Crear mi familia</h2>
          <form action={createAction} className="flex gap-2">
            <input
              name="family_name"
              required
              placeholder="Ej: Familia González"
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900"
            />
            <button
              type="submit"
              disabled={createPending}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {createPending ? "..." : "Crear"}
            </button>
          </form>
          {createState?.error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{createState.error}</p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">🔑 Unirme con código</h2>
          <form action={joinAction} className="flex gap-2">
            <input
              name="code"
              required
              placeholder="Ej: A2B3C4"
              autoCapitalize="characters"
              maxLength={8}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 text-center font-mono text-sm uppercase tracking-widest outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900"
            />
            <button
              type="submit"
              disabled={joinPending}
              className="rounded-xl border border-brand-600 bg-brand-50 dark:bg-brand-950 px-4 py-2.5 text-sm font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 disabled:opacity-60"
            >
              {joinPending ? "..." : "Unirme"}
            </button>
          </form>
          {joinState?.error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{joinState.error}</p>
          )}
        </section>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Un solo celular puede ver todo: compartí el código para que todos participen.
        </p>
      </div>
    </main>
  );
}
