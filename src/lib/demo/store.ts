/**
 * 🧪 MODO DEMO
 * Datos en memoria de una familia paraguaya ficticia para poder usar la app
 * completa sin configurar Supabase. Se activa con NEXT_PUBLIC_DEMO_MODE=1.
 * Cuando se configure el backend real, basta con quitar la variable.
 */
import type {
  Budget,
  Category,
  Currency,
  Debt,
  Family,
  FamilyMember,
  FxRate,
  Profile,
  RecurringBill,
  Transaction,
  TransactionMember,
  TxScope,
  TxType,
} from '@/lib/types'
import { currentMonth, previousMonths } from '@/lib/money'

export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1'

interface DemoDb {
  profile: Profile
  family: Family
  members: FamilyMember[]
  categories: Category[]
  transactions: Transaction[]
  shares: TransactionMember[]
  budgets: Budget[]
  bills: RecurringBill[]
  debts: Debt[]
  rates: FxRate[]
}

let seq = 1000
const uid = (prefix: string) => `${prefix}-${++seq}`

const today = new Date()
const todayDay = today.getDate()
const iso = (day: number) => {
  const d = Math.min(Math.max(day, 1), todayDay)
  const m = String(today.getMonth() + 1).padStart(2, '0')
  return `${today.getFullYear()}-${m}-${String(d).padStart(2, '0')}`
}
const isoOf = (month: string, day: number) =>
  `${month}-${String(Math.min(day, 28)).padStart(2, '0')}`

function seed(): DemoDb {
  const month = currentMonth()
  const past = previousMonths(6, month).slice(0, -1)

  const categories: Category[] = [
    ['c-mercado', 'Mercado', 'expense', '🛒', '#f59e0b'],
    ['c-luz', 'Luz (ANDE)', 'expense', '💡', '#eab308'],
    ['c-agua', 'Agua (ESSAP)', 'expense', '💧', '#3b82f6'],
    ['c-gas', 'Gas', 'expense', '🔥', '#f97316'],
    ['c-internet', 'Internet', 'expense', '📶', '#06b6d4'],
    ['c-telefono', 'Teléfono', 'expense', '📱', '#8b5cf6'],
    ['c-cable', 'Cable / TV', 'expense', '📺', '#64748b'],
    ['c-alquiler', 'Alquiler', 'expense', '🏠', '#ef4444'],
    ['c-transporte', 'Transporte', 'expense', '🚌', '#10b981'],
    ['c-gasolina', 'Gasolina', 'expense', '⛽', '#84cc16'],
    ['c-salud', 'Salud', 'expense', '🏥', '#ec4899'],
    ['c-educacion', 'Educación', 'expense', '🎒', '#14b8a6'],
    ['c-ropa', 'Ropa', 'expense', '👕', '#6366f1'],
    ['c-hogar', 'Hogar', 'expense', '🧽', '#78716c'],
    ['c-regalos', 'Regalos y fiestas', 'expense', '🎁', '#e879f9'],
    ['c-salidas', 'Salidas', 'expense', '🍽️', '#fb923c'],
    ['c-ahorro', 'Ahorro', 'expense', '🐖', '#22c55e'],
    ['c-otros', 'Otros gastos', 'expense', '📌', '#94a3b8'],
    ['c-sueldo', 'Sueldo', 'income', '💼', '#16a34a'],
    ['c-negocio', 'Negocio / Extra', 'income', '🧾', '#0d9488'],
    ['c-venta', 'Venta', 'income', '🏷️', '#2563eb'],
    ['c-bono', 'Bono / Beneficio', 'income', '🎉', '#d946ef'],
    ['c-otros-ing', 'Otros ingresos', 'income', '💰', '#65a30d'],
  ].map(([id, name, type, icon, color]) => ({
    id,
    family_id: 'demo-family',
    name: name as string,
    type: type as TxType,
    icon: icon as string,
    color: color as string,
    created_at: '2026-01-01T00:00:00Z',
  }))

  const members: FamilyMember[] = [
    {
      id: 'mem-carlos',
      family_id: 'demo-family',
      user_id: 'demo-user',
      name: 'Carlos',
      color: '#16a34a',
      role: 'admin',
      active: true,
      joined_at: '2026-01-01T00:00:00Z',
      left_at: null,
    },
    {
      id: 'mem-maria',
      family_id: 'demo-family',
      user_id: null,
      name: 'María',
      color: '#3b82f6',
      role: 'member',
      active: true,
      joined_at: '2026-01-01T00:00:00Z',
      left_at: null,
    },
    {
      id: 'mem-sofi',
      family_id: 'demo-family',
      user_id: null,
      name: 'Sofi',
      color: '#ec4899',
      role: 'member',
      active: true,
      joined_at: '2026-01-01T00:00:00Z',
      left_at: null,
    },
  ]

  const txs: Transaction[] = []
  const shares: TransactionMember[] = []
  let txSeq = 0
  const add = (
    type: TxType,
    amount: number,
    categoryId: string,
    date: string,
    opts: { description?: string; currency?: Currency; pygRate?: number; scope?: TxScope; memberIds?: string[] } = {}
  ) => {
    const id = `tx-${++txSeq}`
    txs.push({
      id,
      family_id: 'demo-family',
      type,
      amount,
      currency: opts.currency ?? 'PYG',
      pyg_rate: opts.pygRate ?? (opts.currency === 'USD' ? 7450 : 1),
      category_id: categoryId,
      description: opts.description ?? null,
      date,
      scope: opts.scope ?? (opts.memberIds ? 'members' : 'family'),
      created_by: 'demo-user',
      created_at: `${date}T12:00:00Z`,
    })
    if (opts.memberIds?.length) {
      const share = Math.round((amount / opts.memberIds.length) * 100) / 100
      opts.memberIds.forEach((member_id, i) => {
        shares.push({
          transaction_id: id,
          member_id,
          amount:
            i === opts.memberIds!.length - 1
              ? Math.round((amount - share * (opts.memberIds!.length - 1)) * 100) / 100
              : share,
        })
      })
    }
  }

  // --- Mes actual: el detalle de una familia real ---
  add('income', 4800000, 'c-sueldo', iso(1), { description: 'Sueldo de Carlos' })
  add('income', 2100000, 'c-sueldo', iso(1), { description: 'Sueldo de María' })
  add('income', 450000, 'c-negocio', iso(2), { description: 'Trabajo extra (bordado)' })
  add('income', 120, 'c-venta', iso(6), {
    description: 'Venta en dólares (mercadería)',
    currency: 'USD',
  })
  add('expense', 1500000, 'c-alquiler', iso(2), { description: 'Alquiler mensual' })
  add('expense', 685000, 'c-mercado', iso(3), { description: 'Mercado en Trinidad' })
  add('expense', 232500, 'c-luz', iso(4), { description: 'Luz ANDE' })
  add('expense', 98000, 'c-agua', iso(5), { description: 'Agua ESSAP' })
  add('expense', 75000, 'c-gas', iso(5), { description: 'Garrafa de gas' })
  add('expense', 189000, 'c-internet', iso(6), { description: 'Tigo Fibra' })
  add('expense', 46000, 'c-transporte', iso(7), { description: 'Micro y combis' })
  add('expense', 210000, 'c-gasolina', iso(8), { description: 'Gasolina' })
  add('expense', 132000, 'c-salidas', iso(9), {
    description: 'Almuerzo en la plaza',
    scope: 'members',
    memberIds: ['mem-carlos', 'mem-maria'],
  })
  add('expense', 185000, 'c-ropa', iso(10), {
    description: 'Zapatillas nuevas',
    scope: 'members',
    memberIds: ['mem-sofi'],
  })
  add('expense', 420000, 'c-educacion', iso(11), {
    description: 'Cuota escolar',
    scope: 'members',
    memberIds: ['mem-carlos', 'mem-maria', 'mem-sofi'],
  })
  add('expense', 312000, 'c-mercado', iso(12), { description: 'Verdulería y carnicería' })
  add('expense', 265000, 'c-salidas', iso(13), { description: 'Cena del aniversario' })
  add('expense', 87000, 'c-salud', iso(14), { description: 'Farmacia' })
  add('expense', 60000, 'c-telefono', iso(15), { description: 'Recarga Tigo' })

  // --- Meses anteriores: para el gráfico de 6 meses ---
  past.forEach((m, i) => {
    const bump = 1 + i * 0.02
    add('income', Math.round(4800000 * bump), 'c-sueldo', isoOf(m, 1))
    add('income', 2100000, 'c-sueldo', isoOf(m, 1))
    add('expense', 1500000, 'c-alquiler', isoOf(m, 2))
    add('expense', Math.round(560000 * bump), 'c-mercado', isoOf(m, 3))
    add('expense', Math.round(520000 * bump), 'c-mercado', isoOf(m, 10))
    add('expense', Math.round(430000 * bump), 'c-mercado', isoOf(m, 20))
    add('expense', Math.round(180000 * bump), 'c-luz', isoOf(m, 4))
    add('expense', 95000, 'c-agua', isoOf(m, 5))
    add('expense', 189000, 'c-internet', isoOf(m, 6))
    add('expense', Math.round(300000 * bump), 'c-salidas', isoOf(m, 14))
    add('expense', Math.round(230000 * bump), 'c-gasolina', isoOf(m, 16))
    add('expense', 70000, 'c-telefono', isoOf(m, 25))
  })

  const bills: RecurringBill[] = (
    [
      ['b-alquiler', 'Alquiler', 1500000, 2, 'c-alquiler'],
      ['b-luz', 'Luz (ANDE)', 232500, 4, 'c-luz'],
      ['b-agua', 'Agua (ESSAP)', 98000, 5, 'c-agua'],
      ['b-internet', 'Tigo Fibra', 189000, 6, 'c-internet'],
      ['b-gas', 'Gas (garrafa)', 75000, 12, 'c-gas'],
      ['b-cable', 'Tigo TV / Cable', 105000, 20, 'c-cable'],
      ['b-telefono', 'Plan celular', 60000, 25, 'c-telefono'],
    ] as [string, string, number, number, string][]
  ).map(([id, name, amount, due_day, cat]) => ({
    id,
    family_id: 'demo-family',
    name,
    amount,
    currency: 'PYG' as Currency,
    pyg_rate: 1,
    category_id: cat,
    due_day,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  }))

  const dueIn150 = new Date()
  dueIn150.setDate(dueIn150.getDate() + 150)

  const debts: Debt[] = [
    {
      id: 'd-prestamo',
      family_id: 'demo-family',
      name: 'Préstamo personal',
      direction: 'owe',
      counterparty: 'Banco Familiar',
      total_amount: 12000000,
      paid_amount: 4500000,
      currency: 'PYG',
      pyg_rate: 1,
      due_date: dueIn150.toISOString().slice(0, 10),
      active: true,
      created_at: '2026-02-01T00:00:00Z',
    },
    {
      id: 'd-moto',
      family_id: 'demo-family',
      name: 'Cuota de la moto',
      direction: 'owe',
      counterparty: 'Itaú',
      total_amount: 9600000,
      paid_amount: 2400000,
      currency: 'PYG',
      pyg_rate: 1,
      due_date: null,
      active: true,
      created_at: '2026-04-01T00:00:00Z',
    },
    {
      id: 'd-sillones',
      family_id: 'demo-family',
      name: 'Venta de sillones',
      direction: 'lent',
      counterparty: 'Roberto (vecino)',
      total_amount: 1800000,
      paid_amount: 600000,
      currency: 'PYG',
      pyg_rate: 1,
      due_date: null,
      active: true,
      created_at: '2026-06-01T00:00:00Z',
    },
  ]

  const budgets: Budget[] = (
    [
      ['bu-mercado', 'c-mercado', 900000],
      ['bu-salidas', 'c-salidas', 350000],
      ['bu-gasolina', 'c-gasolina', 300000],
      ['bu-luz', 'c-luz', 300000],
    ] as [string, string, number][]
  ).map(([id, cat, amount]) => ({
    id,
    family_id: 'demo-family',
    category_id: cat,
    month,
    amount,
  }))

  const rates: FxRate[] = [7, 6, 5, 4, 3, 2, 1].map((back) => {
    const d = new Date()
    d.setDate(d.getDate() - back)
    return {
      id: `fx-${back}`,
      family_id: 'demo-family',
      day: d.toISOString().slice(0, 10),
      rate: 7400 + back * 25,
    }
  })

  return {
    profile: {
      id: 'demo-user',
      full_name: 'Carlos González',
      created_at: '2026-01-01T00:00:00Z',
    },
    family: {
      id: 'demo-family',
      name: 'Familia González',
      invite_code: 'DEMO26',
      created_by: 'demo-user',
      created_at: '2026-01-01T00:00:00Z',
    },
    members,
    categories,
    transactions: txs,
    shares,
    budgets,
    bills,
    debts,
    rates,
  }
}

// Se guarda en globalThis para sobrevivir a los recargas del servidor en dev
const g = globalThis as unknown as { __demoDb?: DemoDb }
export const db: DemoDb = g.__demoDb ?? (g.__demoDb = seed())

export const demoContext = () => ({
  userId: 'demo-user',
  profile: db.profile,
  family: db.family,
  membership: db.members[0],
})

// ---------- Lecturas ----------
export const demoLatestRate = (): number =>
  db.rates.length ? Math.max(...db.rates.map((r) => r.rate)) : 7450

export const demoCategories = (): Category[] => db.categories

export const demoMembers = (): FamilyMember[] =>
  db.members.filter((m) => m.active)

export const demoFormerMembers = (): FamilyMember[] =>
  db.members.filter((m) => !m.active)

export interface DemoFilters {
  month?: string
  type?: 'income' | 'expense'
  categoryId?: string
  memberId?: string
}

export const demoTransactions = (filters: DemoFilters = {}): Transaction[] => {
  let rows = [...db.transactions]
  if (filters.month) {
    rows = rows.filter((t) => t.date.startsWith(filters.month!))
  }
  if (filters.type) rows = rows.filter((t) => t.type === filters.type)
  if (filters.categoryId) rows = rows.filter((t) => t.category_id === filters.categoryId)
  if (filters.memberId) {
    const ids = new Set(
      db.shares.filter((s) => s.member_id === filters.memberId).map((s) => s.transaction_id)
    )
    rows = rows.filter((t) => ids.has(t.id))
  }
  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  )
}

export const demoTransactionsRange = (from: string, to: string) =>
  db.transactions.filter((t) => t.date >= from && t.date <= to)

export const demoTransaction = (id: string) =>
  db.transactions.find((t) => t.id === id) ?? null

export const demoSharesOf = (txIds: string[]) =>
  db.shares.filter((s) => txIds.includes(s.transaction_id))

export interface DemoShareDetail {
  transaction_id: string
  member_id: string
  amount: number
  member: { name: string; color: string } | null
  tx: { currency: Currency; pyg_rate: number; type: TxType } | null
}

export const demoShareDetails = (txIds: string[]): DemoShareDetail[] =>
  db.shares
    .filter((s) => txIds.includes(s.transaction_id))
    .map((s) => {
      const tx = db.transactions.find((t) => t.id === s.transaction_id)
      const member = db.members.find((m) => m.id === s.member_id)
      return {
        transaction_id: s.transaction_id,
        member_id: s.member_id,
        amount: s.amount,
        member: member ? { name: member.name, color: member.color } : null,
        tx: tx
          ? { currency: tx.currency, pyg_rate: Number(tx.pyg_rate), type: tx.type }
          : null,
      }
    })

export const demoBudgets = () => db.budgets

export const demoBills = () => db.bills.filter((b) => b.active)

export const demoDebts = () => [...db.debts].reverse()

// ---------- Escrituras ----------
export const demoSaveTransaction = (
  input: {
    id?: string
    type: TxType
    amount: number
    currency: Currency
    date: string
    categoryId: string
    description: string
    scope: TxScope
    memberIds: string[]
  },
  rate: number
) => {
  const payload = {
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    pyg_rate: input.currency === 'USD' ? rate : 1,
    category_id: input.categoryId || null,
    description: input.description || null,
    date: input.date,
    scope: input.scope,
  }
  let id = input.id
  if (id) {
    const tx = db.transactions.find((t) => t.id === id)
    if (tx) Object.assign(tx, payload)
    db.shares = db.shares.filter((s) => s.transaction_id !== id)
  } else {
    id = uid('tx')
    db.transactions.push({
      id,
      family_id: 'demo-family',
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      ...payload,
    } as Transaction)
  }
  if (input.scope === 'members' && input.memberIds.length) {
    const share = Math.round((input.amount / input.memberIds.length) * 100) / 100
    input.memberIds.forEach((member_id, i) => {
      db.shares.push({
        transaction_id: id!,
        member_id,
        amount:
          i === input.memberIds.length - 1
            ? Math.round((input.amount - share * (input.memberIds.length - 1)) * 100) / 100
            : share,
      })
    })
  }
}

export const demoDeleteTransaction = (id: string) => {
  db.transactions = db.transactions.filter((t) => t.id !== id)
  db.shares = db.shares.filter((s) => s.transaction_id !== id)
}

export const demoUpsertBudget = (categoryId: string, month: string, amount: number) => {
  const existing = db.budgets.find(
    (b) => b.category_id === categoryId && b.month === month
  )
  if (existing) existing.amount = amount
  else db.budgets.push({ id: uid('bu'), family_id: 'demo-family', category_id: categoryId, month, amount })
}

export const demoDeleteBudget = (id: string) => {
  db.budgets = db.budgets.filter((b) => b.id !== id)
}

export const demoSaveBill = (
  input: { id?: string; name: string; amount: number; currency: Currency; dueDay: number; categoryId: string },
  rate: number
) => {
  const payload = {
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    pyg_rate: input.currency === 'USD' ? rate : 1,
    due_day: input.dueDay,
    category_id: input.categoryId || null,
  }
  if (input.id) {
    const bill = db.bills.find((b) => b.id === input.id)
    if (bill) Object.assign(bill, payload)
  } else {
    db.bills.push({
      id: uid('b'),
      family_id: 'demo-family',
      active: true,
      created_at: new Date().toISOString(),
      ...payload,
    } as RecurringBill)
  }
}

export const demoToggleBill = (id: string) => {
  const bill = db.bills.find((b) => b.id === id)
  if (bill) bill.active = !bill.active
}

export const demoPayBill = (id: string) => {
  const bill = db.bills.find((b) => b.id === id)
  if (!bill) return
  db.transactions.push({
    id: uid('tx'),
    family_id: 'demo-family',
    type: 'expense',
    amount: bill.amount,
    currency: bill.currency,
    pyg_rate: bill.pyg_rate,
    category_id: bill.category_id,
    description: `Pago: ${bill.name}`,
    date: new Date().toISOString().slice(0, 10),
    scope: 'family',
    created_by: 'demo-user',
    created_at: new Date().toISOString(),
  })
}

export const demoDeleteBill = (id: string) => {
  db.bills = db.bills.filter((b) => b.id !== id)
}

export const demoAddDebt = (input: {
  name: string
  direction: 'owe' | 'lent'
  counterparty: string
  total: number
  currency: Currency
  dueDate: string
}, rate: number) => {
  db.debts.push({
    id: uid('d'),
    family_id: 'demo-family',
    name: input.name,
    direction: input.direction,
    counterparty: input.counterparty || null,
    total_amount: input.total,
    paid_amount: 0,
    currency: input.currency,
    pyg_rate: input.currency === 'USD' ? rate : 1,
    due_date: input.dueDate || null,
    active: true,
    created_at: new Date().toISOString(),
  })
}

export const demoPayDebt = (id: string, amount: number): { error?: string; ok?: boolean } => {
  const debt = db.debts.find((d) => d.id === id)
  if (!debt) return { error: 'Deuda no encontrada.' }
  debt.paid_amount = Math.min(Number(debt.total_amount), Number(debt.paid_amount) + amount)
  if (Number(debt.paid_amount) >= Number(debt.total_amount)) debt.active = false
  return { ok: true }
}

export const demoCloseDebt = (id: string) => {
  const debt = db.debts.find((d) => d.id === id)
  if (debt) debt.active = false
}

export const demoDeleteDebt = (id: string) => {
  db.debts = db.debts.filter((d) => d.id !== id)
}

export const demoAddMember = (name: string) => {
  const palette = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']
  db.members.push({
    id: uid('mem'),
    family_id: 'demo-family',
    user_id: null,
    name,
    color: palette[db.members.length % palette.length],
    role: 'member',
    active: true,
    joined_at: new Date().toISOString(),
    left_at: null,
  })
}

export const demoRemoveMember = (
  memberId: string,
  mode: 'archive' | 'delete'
): string | null => {
  const member = db.members.find((m) => m.id === memberId)
  if (!member) return null
  const name = member.name
  if (mode === 'delete') {
    const txIds = db.shares.filter((s) => s.member_id === memberId).map((s) => s.transaction_id)
    db.shares = db.shares.filter((s) => s.member_id !== memberId)
    const stillShared = new Set(db.shares.map((s) => s.transaction_id))
    const orphans = txIds.filter((id) => !stillShared.has(id))
    db.transactions = db.transactions.filter(
      (t) => !(orphans.includes(t.id) && t.scope === 'members')
    )
  }
  member.active = false
  member.user_id = null
  member.left_at = new Date().toISOString()
  return name
}

export const demoRotateInvite = () => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  db.family.invite_code = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('')
}

export const demoSaveRate = (rate: number) => {
  db.rates.push({
    id: uid('fx'),
    family_id: 'demo-family',
    day: new Date().toISOString().slice(0, 10),
    rate,
  })
}

export const demoRenameFamily = (name: string) => {
  db.family.name = name
}

export const demoUpdateProfile = (fullName: string) => {
  db.profile.full_name = fullName
  db.members[0].name = fullName.split(' ')[0] || fullName
}
