import type { ControlTotal, ExpenseLine, Metric } from './types'

export const OTHER_GROUP = 'autres'
export const UNALLOCATED_GROUP = 'non-ventile'

export type YearSource = 'ville' | 'dgfip'

export interface YearRow {
  year: number
  total: number
  byGroup: Record<string, number>
  source: YearSource
  control: number | undefined
}

const roundCents = (value: number) => Math.round(value * 100) / 100

export function groupOf(metric: Metric, line: ExpenseLine): string {
  const group = metric.groups.find((candidate) =>
    candidate.functions[line.nomenclature].includes(line.functionCode),
  )
  return group?.id ?? OTHER_GROUP
}

function sumByYear<T extends { year: number; amount: number }>(items: T[]): Map<number, number> {
  const totals = new Map<number, number>()
  for (const item of items) totals.set(item.year, (totals.get(item.year) ?? 0) + item.amount)
  return totals
}

export function aggregateByYear(
  metric: Metric,
  lines: ExpenseLine[],
  controls: ControlTotal[],
): YearRow[] {
  const natures = new Set(metric.natures)
  const metricLines = lines.filter((line) => natures.has(line.nature))
  const controlByYear = sumByYear(controls.filter((control) => natures.has(control.nature)))
  const years = new Set([...metricLines.map((line) => line.year), ...controlByYear.keys()])

  return [...years]
    .sort((a, b) => a - b)
    .map((year): YearRow => {
      const yearLines = metricLines.filter((line) => line.year === year)
      const control = controlByYear.get(year)
      const rounded = control === undefined ? undefined : roundCents(control)

      if (yearLines.length === 0) {
        const total = rounded ?? 0
        return { year, total, byGroup: { [UNALLOCATED_GROUP]: total }, source: 'dgfip', control }
      }

      const byGroup: Record<string, number> = {}
      for (const line of yearLines) {
        const group = groupOf(metric, line)
        byGroup[group] = roundCents((byGroup[group] ?? 0) + line.amount)
      }
      const total = roundCents(yearLines.reduce((sum, line) => sum + line.amount, 0))
      return { year, total, byGroup, source: 'ville', control: rounded }
    })
}

export function groupOrder(metric: Metric, rows: YearRow[]): string[] {
  const used = new Set(rows.flatMap((row) => Object.keys(row.byGroup)))
  const ordered = [...metric.groups.map((group) => group.id), OTHER_GROUP, UNALLOCATED_GROUP]
  return ordered.filter((id) => used.has(id))
}

export function changeRatio(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined
  return current / previous - 1
}
