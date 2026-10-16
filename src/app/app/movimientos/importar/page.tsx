import Link from "next/link";
import { getFamilyContext } from "@/lib/session";
import { getCategories } from "@/lib/queries";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  const { family } = await getFamilyContext();
  const categories = await getCategories(family.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          <Link href="/app/movimientos" className="hover:underline">
            ← Movimientos
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-bold">Importar extracto</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Subí el CSV de tu banco (Bancard, Continental, Itaú…) y revisalo antes de
          guardarlo. Nada se guarda hasta que confirmes.
        </p>
      </div>

      <ImportClient categories={categories} />

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950 px-4 py-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p>
          💡 <b>Formatos aceptados:</b> archivos <code>.csv</code> o <code>.txt</code> con
          columnas de fecha, descripción y monto (separado por «,», «;» o tabulación).
        </p>
        <p>
          ¿Tu banco no exporta? Copiá y pegá las filas directamente en el recuadro de
          abajo — también funciona.
        </p>
      </div>
    </div>
  );
}
