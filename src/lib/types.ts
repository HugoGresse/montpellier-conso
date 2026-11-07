export type Nomenclature = 'M14' | 'M57'

export interface ExpenseLine {
  year: number
  nomenclature: Nomenclature
  nature: string
  functionCode: string
  amount: number
  sourceId: string
}

export interface ControlTotal {
  year: number
  nature: string
  amount: number
}

export interface SourceDescription {
  id: string
  title: string
  producer: string
  url: string
  licence: string
}

export interface Dataset {
  generatedAt: string
  lines: ExpenseLine[]
  controls: ControlTotal[]
  functionLabels: Record<Nomenclature, Record<string, string>>
  sources: SourceDescription[]
}

export interface MetricGroup {
  id: string
  label: string
  functions: Record<Nomenclature, string[]>
}

export interface MetricNote {
  title: string
  body: string
}

export interface Metric {
  slug: string
  title: string
  shortTitle: string
  summary: string
  chartCaption: string
  natures: string[]
  natureLabel: string
  groups: MetricGroup[]
  notes: MetricNote[]
}
