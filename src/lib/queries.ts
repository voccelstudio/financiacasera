import { createClient } from '@/lib/supabase/server'
import { monthRange, toPyg, DEFAULT_PYG_RATE } from '@/lib/money'
import type {
  Budget,
  Category,
  Currency,
  FamilyMember,
  RecurringBill,
  Transaction,
} from '@/lib/types'

/** Tasa USD->PYG más reciente de la familia */
export async function getLatestRate(familyId: string): Promise<number> {
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('active', true)
    .order('joined_at')
  return (data as FamilyMember[]) ?? []
}

export interface TransactionFilters {
  month?: string
  type?: 'income' | 'expense'
  categoryId?: string
  memberId?: string
}

export async function getTransactions(
  familyId: string,
  filters: TransactionFilters = {},
  limit = 200
): Promise<Transaction[]> {
  const supabase = await createClient()
  let query = supabase
    .from('transactions')
    .select('*, category:categories(name, icon, color)')
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
  let rows = (data ?? []) as unknown as (Transaction & {
    category: { name: string; icon: string; color: string } | null
  })[]

  if (filters.memberId) {
    const supabase2 = await createClient()
    const { data: shares } = await supabase2
      .from('transaction_members')
      .select('transaction_id')
      .eq('member_id', filters.memberId)
    const ids = new Set((shares ?? []).map((s) => s.transaction_id))
    rows = rows.filter((r) => ids.has(r.id))
  }

  return rows as Transaction[]
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
  const supabase = await createClient()
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('family_id', familyId)
    .eq('month', month)

  if (!budgets?.length) return []

  const { from, to } = monthRange(month)
  const { data: txs } = await supabase
    .from('transactions')
    .select('category_id, amount, currency, pyg_rate, type')
    .eq('family_id', familyId)
    .eq('type', 'expense')
    .gte('date', from)
    .lte('date', to)

  const spentByCat = new Map<string, number>()
  for (const t of txs ?? []) {
    if (!t.category_id) continue
    spentByCat.set(
      t.category_id,
      (spentByCat.get(t.category_id) ?? 0) +
        toPyg(Number(t.amount), t.currency as Currency, Number(t.pyg_rate))
    )
  }

  return (budgets as unknown as { category: Category }[]).map((row) => {
    const budget = row as unknown as Budget & { category: Category }
    return {
      budget,
      category: row.category,
      spent: spentByCat.get(budget.category_id) ?? 0,
    }
  })
}

export async function getRecurringBills(familyId: string): Promise<RecurringBill[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('family_id', familyId)
    .eq('active', true)
    .order('due_day')
  return (data as RecurringBill[]) ?? []
}
