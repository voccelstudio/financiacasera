import type { Currency } from './types'

/** Tasa por defecto USD -> PYG si la familia todavía no registró una */
export const DEFAULT_PYG_RATE = 7300

const pygFormatter = new Intl.NumberFormat('es-PY', {
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formatea un monto para mostrar, con símbolo de moneda */
export function formatMoney(amount: number, currency: Currency = 'PYG'): string {
  if (currency === 'USD') return `US$ ${usdFormatter.format(amount)}`
  return `₲ ${pygFormatter.format(Math.round(amount))}`
}

/** Convierte un monto a guaraníes usando la tasa registrada en el movimiento */
export function toPyg(amount: number, currency: Currency, pygRate: number): number {
  if (currency === 'USD') return amount * (pygRate || DEFAULT_PYG_RATE)
  return amount
}

/** Suma de una lista de montos en guaraníes */
export function sumPyg(items: { amount: number; currency: Currency; pyg_rate: number }[]): number {
  return items.reduce((acc, t) => acc + toPyg(t.amount, t.currency, t.pyg_rate), 0)
}

/** Mes actual en formato 'YYYY-MM' (hora de Paraguay) */
export function currentMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

/** Primer y último día de un mes 'YYYY-MM' (para filtrar en la BD) */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

/** Nombre legible del mes, ej: 'Octubre 2026' */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-PY', {
    month: 'long',
    year: 'numeric',
  })
}

/** Meses anteriores: ej ['2026-07','2026-08','2026-09'] */
export function previousMonths(count: number, base = currentMonth()): string[] {
  const [y, m] = base.split('-').map(Number)
  const months: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
