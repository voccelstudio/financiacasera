import { notFound } from "next/navigation";
import { getFamilyContext } from "@/lib/session";
import {
  getActiveMembers,
  getCategories,
  getLatestRate,
  getShareMemberIds,
  getTransaction,
} from "@/lib/queries";
import { TransactionForm } from "@/components/transaction-form";

export const dynamic = "force-dynamic";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const { family } = await getFamilyContext();

  const [transaction, categories, members, rate, shareMemberIds] = await Promise.all([
    getTransaction(family.id, id),
    getCategories(family.id),
    getActiveMembers(family.id),
    getLatestRate(family.id),
    getShareMemberIds(id),
  ]);

  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold">Editar movimiento</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Corregí lo que necesites y guardá.</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <TransactionForm
          categories={categories}
          members={members}
          defaultRate={rate}
          transaction={transaction}
          initialMemberIds={shareMemberIds}
        />
      </div>
    </div>
  );
}
