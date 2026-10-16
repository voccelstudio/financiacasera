/**
 * Esqueleto que se muestra al instante mientras se resuelve el resumen.
 * Evita la sensación de "pantalla vacía" en navegaciones lentas.
 */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-5 animate-pulse"
      aria-busy="true"
      aria-label="Cargando resumen"
    >
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-6 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Tarjetas de balance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center"
          >
            <div className="mx-auto h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="mx-auto mt-2 h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Secciones */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
        >
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
