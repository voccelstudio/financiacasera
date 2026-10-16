import { getFamilyContext } from "@/lib/session";
import { getActiveMembers, getGoals, getLatestRate } from "@/lib/queries";
import { formatMoney, toPyg } from "@/lib/money";
import { GoalCard } from "./goal-card";
import { GoalForm } from "./goal-form";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const { family } = await getFamilyContext();
  const [goals, members, rate] = await Promise.all([
    getGoals(family.id),
    getActiveMembers(family.id),
    getLatestRate(family.id),
  ]);

  const totalSavedPyg = goals.reduce(
    (acc, g) => acc + toPyg(g.saved, g.currency, g.pyg_rate || rate),
    0
  );
  const done = goals.filter((g) => Number(g.saved) >= Number(g.target_amount)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Metas de ahorro</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Algo para la familia: la heladera, un viaje, el fondo de emergencia…
        </p>
      </div>

      {/* Resumen del ahorro */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Guardado en total</p>
          <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400 tabular">
            {formatMoney(totalSavedPyg)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Metas activas</p>
          <p className="mt-1 text-lg font-bold tabular">
            {goals.length}
            {done > 0 && (
              <span className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">
                {done} ✅
              </span>
            )}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-bold">➕ Nueva meta</h2>
        <GoalForm />
      </section>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
          <p className="text-3xl">🐷</p>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Todavía no hay metas
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Creá la primera arriba: cada aporte te acerca un poquito más.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} members={members} />
          ))}
        </div>
      )}

      <p className="rounded-xl bg-blue-50 dark:bg-blue-950 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        💡 <b>Tip:</b> guardá un poco cada semana aunque sea poco — lo importante es
        la constancia. Los aportes pueden cargarlos distintos miembros.
      </p>
    </div>
  );
}
