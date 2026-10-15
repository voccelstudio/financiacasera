import { notFound } from "next/navigation";
import { getFamilyContext } from "@/lib/session";
import { getActiveMembers, getCategories, getLatestRate } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transaction-form";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const { family } = await getFamilyContext();

  const supabase = await createClient();
  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!transaction) notFound();

  const [categories, members, rate, shareRows] = await Promise.all([
    getCategories(family.id),
    getActiveMembers(family.id),
    getLatestRate(family.id),
    supabase.from("transaction_members").select("member_id").eq("transaction_id", id),
  ]);

  const initialMemberIds = (shareRows.data ?? []).map((r) => r.member_id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold">Editar movimiento</h1>
        <p className="text-xs text-zinc-500">Corregí lo que necesites y guardá.</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <TransactionForm
          categories={categories}
          members={members}
          defaultRate={rate}
          transaction={transaction as unknown as Transaction}
          initialMemberIds={initialMemberIds}
        />
      </div>
    </div>
  );
}
