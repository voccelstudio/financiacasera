"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);
  const [regState, regAction, regPending] = useActionState(signUp, undefined);

  const error =
    state?.error === "__CHECK_EMAIL__" || regState?.error === "__CHECK_EMAIL__"
      ? "Revisá tu email: te enviamos un enlace para confirmar la cuenta."
      : state?.error ?? regState?.error;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-3xl shadow-lg shadow-green-200">
            🏡
          </div>
          <h1 className="text-2xl font-bold">Financia Casera</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Las finanzas de tu familia, bajo control.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <form action={formAction} className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700">Ingresar</h2>
            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Contraseña"
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {pending ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-zinc-400">
            <div className="h-px flex-1 bg-zinc-200" /> o creá cuenta
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form action={regAction} className="space-y-3">
            <input
              name="full_name"
              required
              placeholder="Tu nombre"
              autoComplete="name"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Contraseña (mín. 6 caracteres)"
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            <button
              type="submit"
              disabled={regPending}
              className="w-full rounded-xl border border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
            >
              {regPending ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>
          </form>

          {error && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                error.startsWith("Revisá tu email")
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Hecho con 💚 para familias paraguayas
        </p>
        <p className="mt-1 text-center text-[10px] text-zinc-300">
          <Link href="/politica-privacidad">Privacidad</Link>
        </p>
      </div>
    </main>
  );
}
