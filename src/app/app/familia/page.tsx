import { getFamilyContext } from "@/lib/session";
import { getActiveMembers, getFormerMembers, getShareDetails, getTransactions } from "@/lib/queries";
import { currentMonth, formatMoney, toPyg } from "@/lib/money";
import { AddMemberForm, InviteCode, RemoveMemberDialog } from "./familia-client";

export const dynamic = "force-dynamic";

export default async function FamiliaPage() {
  const { family, membership, userId } = await getFamilyContext();
  const month = currentMonth();

  const [members, txs, former] = await Promise.all([
    getActiveMembers(family.id),
    getTransactions(family.id, { month }),
    getFormerMembers(family.id),
  ]);

  // Gastos asignados por miembro este mes
  const shareRows = await getShareDetails(txs.map((t) => t.id));

  const spentByMember = new Map<string, number>();
  for (const row of shareRows) {
    if (!row.tx || row.tx.type !== "expense") continue;
    spentByMember.set(
      row.member_id,
      (spentByMember.get(row.member_id) ?? 0) +
        toPyg(Number(row.amount), row.tx.currency, Number(row.tx.pyg_rate))
    );
  }

  const isAdmin = membership.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Familia: {family.name}</h1>
        <p className="text-xs text-zinc-500">
          {members.length} miembro{members.length !== 1 ? "s" : ""} activo
          {members.length !== 1 ? "s" : ""} · tu rol: {isAdmin ? "👤 admin" : "miembro"}
        </p>
      </div>

      <InviteCode code={family.invite_code} familyName={family.name} />

      {/* Lista de miembros */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">👨‍👩‍👧 Miembros activos</h2>
        <ul className="divide-y divide-zinc-100">
          {members.map((m) => {
            const spent = spentByMember.get(m.id) ?? 0;
            const isMe = m.user_id === userId;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {isMe && <span className="ml-1.5 text-[10px] text-green-600">(vos)</span>}
                    {m.role === "admin" && (
                      <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 tabular">
                    Gastos propios este mes: {formatMoney(spent)}
                  </p>
                </div>
                {isAdmin && !isMe && <RemoveMemberDialog member={m} />}
                {isMe && (
                  <span className="text-[11px] text-zinc-300">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Agregar miembro sin cuenta */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-bold">➕ Agregar miembro</h2>
        <p className="mb-3 text-[11px] text-zinc-400">
          Para niños o personas que no van a usar la app: podés asignarle gastos igual.
          Si va a usar la app, compartile el código de arriba.
        </p>
        <AddMemberForm />
      </section>

      {/* Miembros que salieron */}
      {former.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">🚪 Ya no forman parte</h2>
          <ul className="space-y-2 text-sm">
            {former.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-zinc-500">
                <span>{m.name}</span>
                <span className="text-xs">
                  {m.left_at
                    ? `se fue ${new Date(m.left_at).toLocaleDateString("es-PY")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-zinc-400">
            Su historial se conserva en los reportes anteriores.
          </p>
        </section>
      )}

      <p className="rounded-xl bg-purple-50 px-4 py-3 text-xs text-purple-700">
        💡 <b>Separación de cuentas:</b> cuando cargás un gasto elegís si es de la{" "}
        <b>familia en general</b> o si corresponde a <b>miembros específicos</b>. Así, si
        alguien se va, sus gastos personales se pueden borrar sin tocar lo compartido.
      </p>
    </div>
  );
}
