import { toPyg } from './money'
import type { GoalContribution, SavingsGoal } from './types'

export type GoalLike = Pick<SavingsGoal, 'currency' | 'pyg_rate' | 'target_amount'>

/**
 * Cuánto se guardó hasta ahora en una meta, convertido a la moneda de la meta.
 * Los aportes se cargan en la moneda de la meta; si difieren, se convierten vía PYG.
 */
export function goalSaved(goal: GoalLike, contribs: GoalContribution[]): number {
  return contribs.reduce((acc, c) => {
    if (c.currency === goal.currency) return acc + c.amount
    const pyg = toPyg(c.amount, c.currency, c.pyg_rate)
    return acc + (goal.currency === 'USD' ? pyg / (goal.pyg_rate || 1) : pyg)
  }, 0)
}

/** Avance de la meta en porcentaje (0–100) */
export function goalPct(goal: GoalLike, contribs: GoalContribution[]): number {
  const target = Number(goal.target_amount)
  if (!target) return 0
  return Math.min(100, Math.round((goalSaved(goal, contribs) / target) * 100))
}
