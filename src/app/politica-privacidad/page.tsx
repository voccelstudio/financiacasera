import Link from "next/link";

export default function PoliticaPrivacidad() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10 text-sm leading-relaxed text-zinc-700">
      <h1 className="text-xl font-bold">Política de privacidad</h1>
      <p className="mt-1 text-xs text-zinc-400">Financia Casera</p>

      <section className="mt-5 space-y-3">
        <p>
          <b>¿Qué datos guardamos?</b> Solo los que vos cargás: nombre, email, miembros de
          la familia, ingresos, gastos, presupuestos y deudas. No pedimos datos bancarios
          ni tarjetas de crédito.
        </p>
        <p>
          <b>¿Para qué se usan?</b> Únicamente para mostrarte los reportes y resúmenes de
          tu propia familia dentro de la app.
        </p>
        <p>
          <b>¿Quién puede ver mis datos?</b> Solo las personas que se unan a tu familia
          con el código de invitación. Cada familia está aislada: nadie más puede verla.
        </p>
        <p>
          <b>¿Dónde se guardan?</b> En Supabase (Google Cloud), con permisos de acceso
          por fila: cada usuario solo puede leer y escribir en su familia.
        </p>
        <p>
          <b>¿Cómo borro mis datos?</b> Podés salir de la familia desde Ajustes y pedir
          la eliminación de tu cuenta escribiéndonos. Tus movimientos asociados se
          eliminan junto con la cuenta.
        </p>
        <p>
          <b>Publicidad y terceros.</b> No mostramos publicidad ni vendemos información a
          terceros.
        </p>
      </section>

      <p className="mt-6">
        <Link href="/" className="text-green-700 underline">
          ← Volver a la app
        </Link>
      </p>
    </main>
  );
}
