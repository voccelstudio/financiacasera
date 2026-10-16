import Link from "next/link";
import { getFamilyContext } from "@/lib/session";
import { getLatestRate } from "@/lib/queries";
import { PalettePicker } from "@/components/palette-picker";
import { FamilyNameForm, LeaveFamilyButton, ProfileNameForm, RateForm } from "./ajustes-client";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const { family, membership, profile } = await getFamilyContext();
  const rate = await getLatestRate(family.id);
  const isAdmin = membership.role === "admin";

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold">Ajustes</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Datos de tu familia y de tu cuenta.</p>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-1 text-sm font-bold">🎨 Apariencia</h2>
        <p className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          Color de la app para toda la familia. El modo claro/oscuro lo cambiás con el botón ☀️🌙
          de arriba. Tus ingresos siempre se ven en verde y los gastos en rojo, sea cual sea el
          color que elijas.
        </p>
        <PalettePicker />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">💱 Tasa de cambio (USD → PYG)</h2>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Se usa para convertir los montos en dólares. Actualizala cuando cambie el
          dólar (casa de cambio, bancos).
        </p>
        <RateForm defaultRate={rate} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">👨‍👩‍👧 Nombre de la familia</h2>
        <FamilyNameForm initialName={family.name} canEdit={isAdmin} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">👤 Tu perfil</h2>
        <ProfileNameForm initialName={profile?.full_name ?? membership.name} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">🚪 Salir de la familia</h2>
        <p className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          Tus gastos personales quedan archivados y los gastos de la familia se
          conservan. Podés volver a unirte con el código de invitación cuando quieras.
        </p>
        <LeaveFamilyButton familyName={family.name} />
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-xs text-zinc-500 dark:text-zinc-400">
        <h2 className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">ℹ️ Sobre la app</h2>
        <p>Financia Casera v1.0 — Monedas: guaraníes (₲) y dólares (US$).</p>
        <p className="mt-1">
          <Link href="/politica-privacidad" className="text-brand-700 dark:text-brand-300 underline">
            Política de privacidad
          </Link>
        </p>
      </section>
    </div>
  );
}
