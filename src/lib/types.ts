export type Currency = 'PYG' | 'USD'
export type TxType = 'income' | 'expense'
export type TxScope = 'family' | 'members'

export interface Family {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  created_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string | null
  name: string
  color: string
  role: 'admin' | 'member'
  active: boolean
  joined_at: string
  left_at: string | null
}

export interface Category {
  id: string
  family_id: string
  name: string
  type: TxType
  icon: string
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  family_id: string
  type: TxType
  amount: number
  currency: Currency
  pyg_rate: number
  category_id: string | null
  description: string | null
  date: string
  scope: TxScope
  created_by: string | null
  created_at: string
}

export interface TransactionMember {
  transaction_id: string
  member_id: string
  amount: number
}

export interface Budget {
  id: string
  family_id: string
  category_id: string
  month: string
  amount: number
}

export interface RecurringBill {
  id: string
  family_id: string
  name: string
  amount: number
  currency: Currency
  pyg_rate: number
  category_id: string | null
  due_day: number
  active: boolean
  created_at: string
}

export interface Debt {
  id: string
  family_id: string
  name: string
  direction: 'owe' | 'lent'
  counterparty: string | null
  total_amount: number
  paid_amount: number
  currency: Currency
  pyg_rate: number
  due_date: string | null
  active: boolean
  created_at: string
}

export interface FxRate {
  id: string
  family_id: string
  day: string
  rate: number
}

/** Movimiento con datos relacionados para mostrar en listas */
export interface TransactionWithDetails extends Transaction {
  category: Pick<Category, 'name' | 'icon' | 'color'> | null
  shares: { member_id: string; amount: number; member: Pick<FamilyMember, 'name' | 'color'> }[]
  creator_name?: string | null
}
