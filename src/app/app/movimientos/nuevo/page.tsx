import { getFamilyContext } from "@/lib/session";
import { getActiveMembers, getCategories, getLatestRate } from "@/lib/queries";
import { TransactionForm } from "@/components/transaction-form";

export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage() {
  const { family } = await getFamilyContext();
  const [categories, members, rate] = await Promise.all([
    getCategories(family.id),
    getActiveMembers(family.id),
    getLatestRate(family.id),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold">Nuevo movimiento</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Registrá un ingreso o un gasto del hogar.</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <TransactionForm
          categories={categories}
          members={members}
          defaultRate={rate}
        />
      </div>
    </div>
  );
}
