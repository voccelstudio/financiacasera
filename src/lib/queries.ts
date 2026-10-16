import { createClient } from '@/lib/supabase/server'
import { monthRange, toPyg, DEFAULT_PYG_RATE } from '@/lib/money'
import {
  DEMO,
  demoBills,
  demoBudgets,
  demoCategories,
  demoDebts,
  demoFormerMembers,
  demoLatestRate,
  demoMembers,
  demoShareDetails,
  demoTransaction,
  demoTransactions,
  demoTransactionsRange,
  type DemoFilters,
} from '@/lib/demo/store'
import type {
  Budget,
  Category,
  Currency,
  FamilyMember,
  RecurringBill,
  Transaction,
  TxType,
} from '@/lib/types'

/** Tasa USD->PYG más reciente de la familia */
export async function getLatestRate(familyId: string): Promise<number> {
  if (DEMO) return demoLatestRate()
  const supabase = await createClient()
  const { data } = await supabase
    .from('fx_rates')
    .select('rate')
    .eq('family_id', familyId)
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? Number(data.rate) : DEFAULT_PYG_RATE
}

export async function getCategories(familyId: string): Promise<Category[]> {
  if (DEMO) return demoCategories()
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('family_id', familyId)
    .order('type')
    .order('name')
  return (data as Category[]) ?? []
}

export async function getActiveMembers(familyId: string): Promise<FamilyMember[]> {
  if (DEMO) return demoMembers()
  const supabase = await createClient()
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('active', true)
    .order('joined_at')
  return (data as FamilyMember[]) ?? []
}

export async function getFormerMembers(familyId: string): Promise<FamilyMember[]> {
  if (DEMO) return demoFormerMembers()
  const supabase = await createClient()
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('active', false)
    .order('left_at', { ascending: false })
  return (data as FamilyMember[]) ?? []
}

export type TransactionFilters = DemoFilters

export async function getTransactions(
  familyId: string,
  filters: TransactionFilters = {},
  limit = 200
): Promise<Transaction[]> {
  if (DEMO) return demoTransactions(filters).slice(0, limit)
  const supabase = await createClient()
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('family_id', familyId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.month) {
    const { from, to } = monthRange(filters.month)
    query = query.gte('date', from).lte('date', to)
  }
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)

  const { data } = await query
  let rows = (data ?? []) as Transaction[]

  if (filters.memberId) {
    const { data: shares } = await supabase
      .from('transaction_members')
      .select('transaction_id')
      .eq('member_id', filters.memberId)
    const ids = new Set((shares ?? []).map((s) => s.transaction_id))
    rows = rows.filter((r) => ids.has(r.id))
  }

  return rows
}

/** Rango de fechas (para reportes de varios meses) */
export async function getTransactionsRange(
  familyId: string,
  from: string,
  to: string
): Promise<Transaction[]> {
  if (DEMO) return demoTransactionsRange(from, to)
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('type, amount, currency, pyg_rate, date')
    .eq('family_id', familyId)
    .gte('date', from)
    .lte('date', to)
  return (data as Transaction[]) ?? []
}

export async function getTransaction(
  familyId: string,
  id: string
): Promise<Transaction | null> {
  if (DEMO) return demoTransaction(id)
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('family_id', familyId)
    .maybeSingle()
  return data as Transaction | null
}

export interface ShareDetail {
  transaction_id: string
  member_id: string
  amount: number
  member: { name: string; color: string } | null
  tx: { currency: Currency; pyg_rate: number; type: TxType } | null
}

/** Reparto de movimientos entre miembros, con datos de miembro y movimiento */
export async function getShareDetails(txIds: string[]): Promise<ShareDetail[]> {
  if (!txIds.length) return []
  if (DEMO) return demoShareDetails(txIds)
  const supabase = await createClient()
  const { data } = await supabase
    .from('transaction_members')
    .select(
      'transaction_id, member_id, amount, member:family_members(name, color), tx:transactions(currency, pyg_rate, type)'
    )
    .in('transaction_id', txIds)
  return (data as unknown as ShareDetail[]) ?? []
}

export async function getShareMemberIds(transactionId: string): Promise<string[]> {
  if (DEMO) return demoShareDetails([transactionId]).map((s) => s.member_id)
  const supabase = await createClient()
  const { data } = await supabase
    .from('transaction_members')
    .select('member_id')
    .eq('transaction_id', transactionId)
  return (data ?? []).map((r) => r.member_id)
}

export interface MonthSummary {
  income: number
  expense: number
  balance: number
}

export function summarize(rows: Transaction[]): MonthSummary {
  let income = 0
  let expense = 0
  for (const r of rows) {
    const pyg = toPyg(Number(r.amount), r.currency as Currency, Number(r.pyg_rate))
    if (r.type === 'income') income += pyg
    else expense += pyg
  }
  return { income, expense, balance: income - expense }
}

export async function getBudgetsWithSpent(
  familyId: string,
  month: string
): Promise<{ budget: Budget; category: Category; spent: number }[]> {
  const { from, to } = monthRange(month)
  const txs = DEMO
    ? demoTransactions({ month }).filter((t) => t.type === 'expense')
    : await getExpensesInRange(familyId, from, to)

  const spentByCat = new Map<string, number>()
  for (const t of txs) {
    if (!t.category_id) continue
    spentByCat.set(
      t.category_id,
      (spentByCat.get(t.category_id) ?? 0) +
        toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate))
    )
  }

  const budgets = DEMO ? demoBudgets() : getBudgets(familyId, month)
  const [budgetRows, categories] = await Promise.all([
    budgets,
    getCategories(familyId),
  ])
  const catMap = new Map(categories.map((c) => [c.id, c]))

  return budgetRows
    .filter((b) => b.month === month)
    .map((budget) => ({
      budget,
      category: catMap.get(budget.category_id) as Category,
      spent: spentByCat.get(budget.category_id) ?? 0,
    }))
    .filter((row) => row.category)
}

async function getBudgets(familyId: string, month: string): Promise<Budget[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('budgets')
    .select('*')
    .eq('family_id', familyId)
    .eq('month', month)
  return (data as Budget[]) ?? []
}

async function getExpensesInRange(
  familyId: string,
  from: string,
  to: string
): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('category_id, amount, currency, pyg_rate, type')
    .eq('family_id', familyId)
    .eq('type', 'expense')
    .gte('date', from)
    .lte('date', to)
  return (data as Transaction[]) ?? []
}

export async function getRecurringBills(familyId: string): Promise<RecurringBill[]> {
  if (DEMO) return demoBills()
  const supabase = await createClient()
  const { data } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('family_id', familyId)
    .eq('active', true)
    .order('due_day')
  return (data as RecurringBill[]) ?? []
}

export interface DebtWithPyg {
  id: string
  name: string
  direction: 'owe' | 'lent'
  counterparty: string | null
  total_amount: number
  paid_amount: number
  currency: Currency
  pyg_rate: number
  due_date: string | null
  active: boolean
}

export async function getDebts(familyId: string): Promise<DebtWithPyg[]> {
  if (DEMO) return demoDebts() as unknown as DebtWithPyg[]
  const supabase = await createClient()
  const { data } = await supabase
    .from('debts')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  return (data as DebtWithPyg[]) ?? []
}
