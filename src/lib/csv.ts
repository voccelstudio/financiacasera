/**
 * Utilidades CSV/TSV sin dependencias (funciona en cliente y servidor).
 * Los extractos bancarios de Paraguay suelen venir con «;» o «,» y coma decimal.
 */

export function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/).find((l) => l.trim()) ?? ''
  const counts: Record<string, number> = {
    ';': (first.match(/;/g) ?? []).length,
    ',': (first.match(/,/g) ?? []).length,
    '\t': (first.match(/\t/g) ?? []).length,
    '|': (first.match(/\|/g) ?? []).length,
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ','
}

/** Parsea texto delimitado (con soporte de campos entre comillas) en filas de celdas */
export function parseDelimited(text: string): string[][] {
  const delim = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delim) {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim())
      cell = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some((c) => c !== '')) rows.push(row)
  return rows
}

/** Convierte filas de celdas a texto CSV (usa «;» para Excel en español) */
export function toCsv(rows: (string | number)[][]): string {
  const body = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell)
          return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(';')
    )
    .join('\r\n')
  // BOM para que Excel abra bien los acentos
  return '\uFEFF' + body
}

// ---------- Lectura de extractos ----------

export interface ParsedMovement {
  date: string // YYYY-MM-DD
  description: string
  amount: number // positivo, en la moneda detectada
  currency: 'PYG' | 'USD'
  type: 'income' | 'expense'
}

const MONTHS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

/** Acepta 2026-10-05, 05/10/2026, 05-10-26, 5 de octubre de 2026… */
export function parseDate(raw: string): string | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (m) {
    let year = Number(m[3])
    if (year < 100) year += 2000
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }

  m = s.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)?/)
  if (m && s.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})/)) {
    const full = s.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})/)
    if (full) {
      const month = MONTHS[full[2]]
      if (month) return `${full[3]}-${String(month).padStart(2, '0')}-${full[1].padStart(2, '0')}`
    }
  }
  return null
}

/** '₲ 1.250.500' / '1.250.500,50' / '-45.000' / '1,234.56' → número */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[₲Gs\$USURS\s]/gi, '').trim()
  if (!s) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  } else if (s.startsWith('+')) s = s.slice(1)

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // El que aparece después es el separador decimal
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (lastComma > -1) {
    // Una sola coma: decimal si tiene 1–2 dígitos después, si no miles
    s = s.length - lastComma - 1 <= 2 ? s.replace(',', '.') : s.replace(/,/g, '')
  } else if (lastDot > -1) {
    // Solo punto: 3 dígitos después = miles paraguayos (45.000),
    // cualquier otra cantidad = decimal (1234.56 / 0.5)
    const decimals = s.length - lastDot - 1
    const dots = (s.match(/\./g) ?? []).length
    if (dots > 1 || (dots === 1 && decimals === 3)) s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negative ? -Math.abs(n) : n
}

const isHeaderCell = (cell: string) =>
  /fecha|date|d[ií]a|descripci[oó]n|detalle|concepto|movimiento|historial|monto|importe|valor|amount|desembolso|dep[oó]sito|extracci[oó]n|saldo|cr[eé]dito|d[eé]bito/i.test(
    cell
  )

/**
 * Convierte las filas de un extracto en movimientos con fecha/descripción/monto.
 * Reconoce cabeceras comunes y formatos paraguayos; lo que no se entienda se saltea.
 */
export function extractMovements(rows: string[][]): {
  movements: ParsedMovement[]
  skipped: number
} {
  if (!rows.length) return { movements: [], skipped: 0 }

  const header = rows[0]
  const hasHeader = header.filter((c) => isHeaderCell(c)).length >= 2
  const cells = hasHeader ? rows.slice(1) : rows

  let dateIdx = 0
  let descIdx = 1
  let amountIdx = -1
  let debitIdx = -1
  let creditIdx = -1
  let currencyFromHeader: 'PYG' | 'USD' = 'PYG'

  if (hasHeader) {
    const find = (re: RegExp) => header.findIndex((c) => re.test(c))
    const d = find(/fecha|date|d[ií]a/i)
    if (d > -1) dateIdx = d
    const desc = find(/descripci[oó]n|detalle|concepto|movimiento|historial|glosa/i)
    if (desc > -1) descIdx = desc
    const amount = find(/monto|importe|valor|amount|movimiento/i)
    const debit = find(/d[eé]bito|cargo|retiro|extracci/i)
    const credit = find(/cr[eé]dito|dep[oó]sito|abono|ingreso/i)
    if (debit > -1) debitIdx = debit
    if (credit > -1) creditIdx = credit
    if (amount > -1 && amount !== debit && amount !== credit) amountIdx = amount
    if (find(/usd|d[oó]lar|dolar/i) > -1) currencyFromHeader = 'USD'
  }

  // Sin cabecera clara: buscar la columna con fechas válidas
  if (!hasHeader) {
    const probe = cells.slice(0, 5)
    for (let col = 0; col < Math.max(...probe.map((r) => r.length)); col++) {
      const hits = probe.filter((r) => parseDate(r[col] ?? '')).length
      if (hits >= Math.ceil(probe.length / 2)) {
        dateIdx = col
        break
      }
    }
    // Monto: primer número parseable distinto de la fecha
    for (let col = 0; col < Math.max(...probe.map((r) => r.length)); col++) {
      if (col === dateIdx) continue
      const hits = probe.filter((r) => parseAmount(r[col] ?? '') !== null).length
      if (hits >= Math.ceil(probe.length / 2)) {
        amountIdx = col
        break
      }
    }
    descIdx = dateIdx === 0 ? 1 : 0
    if (amountIdx === descIdx) descIdx = dateIdx === descIdx + 1 ? descIdx + 1 : descIdx
  }

  const movements: ParsedMovement[] = []
  let skipped = 0

  for (const row of cells) {
    const date = parseDate(row[dateIdx] ?? '')
    if (!date) {
      skipped++
      continue
    }
    const description = (row[descIdx] ?? row.find((c, i) => i !== dateIdx && c && parseAmount(c) === null) ?? '')
      .toString()
      .trim()

    let raw: string | null = null
    if (debitIdx > -1 && creditIdx > -1) {
      const deb = parseAmount(row[debitIdx] ?? '')
      const cred = parseAmount(row[creditIdx] ?? '')
      if (deb && deb > 0) raw = `-${deb}`
      else if (cred && cred > 0) raw = `${cred}`
    } else if (amountIdx > -1) {
      raw = row[amountIdx] ?? null
    } else {
      // Último recurso: la celda numérica más a la derecha
      for (let i = row.length - 1; i >= 0; i--) {
        const n = parseAmount(row[i] ?? '')
        if (n !== null && i !== dateIdx) {
          raw = row[i]
          break
        }
      }
    }

    const amount = raw !== null ? parseAmount(raw) : null
    if (amount === null || amount === 0) {
      skipped++
      continue
    }

    const currency: 'PYG' | 'USD' =
      /usd|\$|d[oó]lar/i.test(raw ?? '') || currencyFromHeader === 'USD' ? 'USD' : 'PYG'
    movements.push({
      date,
      description: description || 'Movimiento importado',
      amount: Math.abs(currency === 'USD' ? Math.round(amount * 100) / 100 : Math.round(amount)),
      currency,
      type: amount < 0 ? 'expense' : 'income',
    })
  }

  return { movements, skipped }
}
