import {
  aggregateByYear,
  groupOrder,
  OTHER_GROUP,
  UNALLOCATED_GROUP,
  type YearRow,
} from './aggregate'
import type { Series } from './chart'
import type { Dataset, Metric, Nomenclature } from './types'

const NEUTRAL = 'var(--series-neutral)'

export interface FunctionCode {
  nomenclature: Nomenclature
  code: string
  label: string
}

export interface MetricView {
  rows: YearRow[]
  series: Series[]
  functionsByGroup: { label: string; codes: FunctionCode[] }[]
}

export function seriesFor(metric: Metric, used: string[]): Series[] {
  const palette = [...metric.groups.map((group) => group.id), OTHER_GROUP]
  const labels = new Map<string, string>([
    ...metric.groups.map((group) => [group.id, group.label] as const),
    [OTHER_GROUP, 'Autres services'],
    [UNALLOCATED_GROUP, 'Non ventilé'],
  ])
  return used.map((id) => {
    const slot = palette.indexOf(id) + 1
    const hatched = id === UNALLOCATED_GROUP
    return {
      id,
      label: labels.get(id) ?? id,
      color: hatched || slot === 0 ? NEUTRAL : `var(--series-${slot})`,
      hatched,
    }
  })
}

export function buildMetricView(metric: Metric, dataset: Dataset): MetricView {
  const rows = aggregateByYear(metric, dataset.lines, dataset.controls)
  const series = seriesFor(metric, groupOrder(metric, rows))

  const functionsByGroup = metric.groups.map((group) => ({
    label: group.label,
    codes: (['M14', 'M57'] as const).flatMap((nomenclature) =>
      group.functions[nomenclature].map((code) => ({
        nomenclature,
        code,
        label: dataset.functionLabels[nomenclature][code] ?? '',
      })),
    ),
  }))

  return { rows, series, functionsByGroup }
}
