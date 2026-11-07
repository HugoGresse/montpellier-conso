import type { ControlTotal } from '../types'

const API = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets'

export function dgfipBalanceUrl(year: number, siren: string, natures: readonly string[]): string {
  const accounts = natures.map((nature) => `"${nature}"`).join(',')
  const where = `siren="${siren}" and compte in (${accounts})`
  const params = new URLSearchParams({ where, limit: '100' })
  return `${API}/balances-comptables-des-communes-en-${year}/records?${params}`
}

interface DgfipRecord {
  compte?: string
  ident?: string
  budget?: string
  cbudg?: number | string
  obnetdeb?: number
  obnetcre?: number
}

const roundCents = (value: number) => Math.round(value * 100) / 100

export function isMainBudget(record: DgfipRecord, siret: string): boolean {
  return record.ident === siret || record.budget === 'BP' || Number(record.cbudg) === 1
}

export function parseDgfipBalance(json: unknown, year: number, siret: string): ControlTotal[] {
  const records = (json as { results?: DgfipRecord[] }).results ?? []
  const totals = new Map<string, number>()
  for (const record of records) {
    if (!record.compte || !isMainBudget(record, siret)) continue
    const net = (record.obnetdeb ?? 0) - (record.obnetcre ?? 0)
    totals.set(record.compte, (totals.get(record.compte) ?? 0) + net)
  }
  return [...totals].map(([nature, amount]) => ({ year, nature, amount: roundCents(amount) }))
}
