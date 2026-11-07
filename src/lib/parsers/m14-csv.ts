import type { ExpenseLine } from '../types'

export interface M14Result {
  lines: ExpenseLine[]
  functionLabels: Record<string, string>
}

const REQUIRED_COLUMNS = [
  'Exercice',
  'I_F',
  'D_R',
  'Nature',
  'SousFonction',
  'Exécuté',
  'Libellé fonction',
] as const

type Column = (typeof REQUIRED_COLUMNS)[number]

function columnIndexes(header: string): Record<Column, number> {
  const columns = header.split(';').map((name) => name.trim())
  const entries = REQUIRED_COLUMNS.map((name) => {
    const index = columns.indexOf(name)
    if (index < 0) throw new Error(`Colonne manquante dans le CSV M14 : ${name}`)
    return [name, index] as const
  })
  return Object.fromEntries(entries) as Record<Column, number>
}

export function parseFrenchNumber(raw: string): number {
  const value = Number(raw.trim().replace(/\s/g, '').replace(',', '.'))
  if (Number.isNaN(value)) throw new Error(`Montant illisible : "${raw}"`)
  return value
}

export function parseM14Csv(
  text: string,
  natures: ReadonlySet<string>,
  sourceId: string,
): M14Result {
  const [header, ...rows] = text.split(/\r?\n/).filter((row) => row.trim() !== '')
  if (!header) return { lines: [], functionLabels: {} }
  const col = columnIndexes(header)
  const lines: ExpenseLine[] = []
  const functionLabels: Record<string, string> = {}

  for (const row of rows) {
    const cells = row.split(';')
    const cell = (name: Column) => (cells[col[name]] ?? '').trim()
    if (cell('D_R') !== 'D' || cell('I_F') !== 'F' || !natures.has(cell('Nature'))) continue

    const functionCode = cell('SousFonction')
    const label = cell('Libellé fonction')
    if (functionCode && label) functionLabels[functionCode] = label

    lines.push({
      year: Number(cell('Exercice')),
      nomenclature: 'M14',
      nature: cell('Nature'),
      functionCode,
      amount: parseFrenchNumber(cell('Exécuté')),
      sourceId,
    })
  }
  return { lines, functionLabels }
}
