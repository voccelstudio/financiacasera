import { toPyg } from './money'
import type { Budget, GoalWithProgress, Transaction } from './types'

export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
  achieved: boolean
  /** 0–100: avance para los que todavía no se lograron */
  progress: number
}

interface Input {
  /** Movimientos de los últimos N meses (incluye el actual) */
  transactions: Transaction[]
  /** Presupuestos del mes actual con lo ya gastado */
  budgets: { budget: Budget; spent: number }[]
  goals: GoalWithProgress[]
  /** Meses considerados, ej: ['2026-05', ..., '2026-10'] */
  months: string[]
}

const monthOf = (t: Transaction) => t.date.slice(0, 7)

const pyg = (t: Transaction) => toPyg(Number(t.amount), t.currency, Number(t.pyg_rate))

/**
 * Logros y rachas de la familia, calculados solo con datos locales
 * (sin servicios externos: funciona en modo demo y offline).
 */
export function computeAchievements(input: Input): Achievement[] {
  const { transactions, budgets, goals, months } = input
  const monthSet = new Set(months)

  // Balance por mes (para la racha "en verde")
  const balanceByMonth = new Map<string, number>()
  const txCountByMonth = new Map<string, number>()
  const payMonths = new Set<string>()
  for (const t of transactions) {
    const m = monthOf(t)
    if (!monthSet.has(m)) continue
    const delta = t.type === 'income' ? pyg(t) : -pyg(t)
    balanceByMonth.set(m, (balanceByMonth.get(m) ?? 0) + delta)
    txCountByMonth.set(m, (txCountByMonth.get(m) ?? 0) + 1)
    if (t.type === 'expense' && (t.description ?? '').toLowerCase().startsWith('pago:')) {
      payMonths.add(m)
    }
  }

  const loggedMonths = months.filter((m) => (txCountByMonth.get(m) ?? 0) > 0).length

  // Racha de meses consecutivos con balance >= 0 (desde el mes actual hacia atrás)
  let streak = 0
  for (let i = months.length - 1; i >= 0; i--) {
    const b = balanceByMonth.get(months[i])
    if (b !== undefined && b >= 0) streak++
    else break
  }

  const totalTx = transactions.length
  const budgetCount = budgets.length
  const overCount = budgets.filter((b) => Number(b.spent) > Number(b.budget.amount)).length
  const nearCount = budgets.filter(
    (b) =>
      Number(b.spent) > Number(b.budget.amount) * 0.8 &&
      Number(b.spent) <= Number(b.budget.amount)
  ).length
  const contributions = goals.reduce((a, g) => a + g.contrib_count, 0)
  const completed = goals.filter((g) => Number(g.saved) >= Number(g.target_amount)).length
  const pct = (a: number, b: number) => Math.max(0, Math.min(100, Math.round((a / Math.max(1, b)) * 100)))

  return [
    {
      id: 'primer-pasito',
      icon: '🐣',
      name: 'Primer pasito',
      desc: 'Cargaste tu primer ingreso o gasto.',
      achieved: totalTx > 0,
      progress: pct(totalTx, 1),
    },
    {
      id: 'libreta',
      icon: '📝',
      name: 'Libreta al día',
      desc: 'Movimientos cargados en 3 de los últimos 6 meses.',
      achieved: loggedMonths >= 3,
      progress: pct(loggedMonths, 3),
    },
    {
      id: 'en-verde',
      icon: '⚖️',
      name: 'Siempre en verde',
      desc: 'Racha de 3 meses seguidos sin gastar de más.',
      achieved: streak >= 3,
      progress: pct(streak, 3),
    },
    {
      id: 'control',
      icon: '🎯',
      name: 'Presupuesto bajo control',
      desc: 'Ninguna categoría se pasó del presupuesto este mes.',
      achieved: budgetCount >= 1 && overCount === 0,
      progress: budgetCount === 0 ? 0 : pct(budgetCount - overCount, budgetCount),
    },
    {
      id: 'ahorrador',
      icon: '🐷',
      name: 'Ahorrador',
      desc: 'Hiciste al menos un aporte a una meta.',
      achieved: contributions > 0,
      progress: pct(contributions, 1),
    },
    {
      id: 'meta-cumplida',
      icon: '🏆',
      name: 'Meta cumplida',
      desc: 'Completaste una meta de ahorro al 100%.',
      achieved: completed > 0,
      progress: pct(completed, 1),
    },
    {
      id: 'cuentas-al-dia',
      icon: '🔁',
      name: 'Cuentas al día',
      desc: 'Pagaste tus cuentas fijas en 3 meses distintos.',
      achieved: payMonths.size >= 3,
      progress: pct(payMonths.size, 3),
    },
    {
      id: 'sin-presupuesto-roto',
      icon: '🛡️',
      name: 'Sin sorpresas',
      desc: 'Ningún presupuesto cerca del límite (80%) este mes.',
      achieved: budgetCount >= 1 && nearCount === 0 && overCount === 0,
      progress: budgetCount === 0 ? 0 : pct(budgetCount - nearCount - overCount, budgetCount),
    },
  ]
}
