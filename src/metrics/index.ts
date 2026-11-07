import type { Metric } from '../lib/types'
import { eau } from './eau'

export const METRICS: Metric[] = [eau]

export const UPCOMING_METRICS = [
  { title: 'Électricité', nature: '60612' },
  { title: 'Chauffage urbain', nature: '60613' },
  { title: 'Carburants', nature: '60622' },
] as const

export const allNatures = (): string[] => [...new Set(METRICS.flatMap((m) => m.natures))]
