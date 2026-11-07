import { describe, expect, test } from 'bun:test'
import { eau } from '../metrics/eau'
import {
  aggregateByYear,
  changeRatio,
  groupOf,
  groupOrder,
  OTHER_GROUP,
  UNALLOCATED_GROUP,
} from './aggregate'
import type { ExpenseLine } from './types'

const line = (overrides: Partial<ExpenseLine>): ExpenseLine => ({
  year: 2016,
  nomenclature: 'M14',
  nature: '60611',
  functionCode: '823',
  amount: 100,
  sourceId: 'test',
  ...overrides,
})

describe('groupOf', () => {
  test('maps M14 and M57 codes of the same service to one group', () => {
    expect(groupOf(eau, line({ functionCode: '823' }))).toBe('espaces-verts')
    expect(groupOf(eau, line({ nomenclature: 'M57', functionCode: '511' }))).toBe('espaces-verts')
  })

  test('does not mix nomenclatures', () => {
    expect(groupOf(eau, line({ nomenclature: 'M57', functionCode: '823' }))).toBe(OTHER_GROUP)
  })
})

describe('aggregateByYear', () => {
  const lines = [
    line({ functionCode: '823', amount: 100.1 }),
    line({ functionCode: '26', amount: 50.2 }),
    line({ functionCode: '64', amount: 10 }),
    line({ nature: '60612', amount: 9999 }),
    line({ year: 2018, nomenclature: 'M57', functionCode: '020', amount: 300 }),
  ]
  const controls = [
    { year: 2016, nature: '60611', amount: 160.3 },
    { year: 2017, nature: '60611', amount: 1399468.62 },
    { year: 2017, nature: '60612', amount: 1 },
  ]
  const rows = aggregateByYear(eau, lines, controls)

  test('sums each year by group, ignoring other accounts', () => {
    expect(rows[0]).toEqual({
      year: 2016,
      total: 160.3,
      byGroup: { 'espaces-verts': 100.1, cimetieres: 50.2, [OTHER_GROUP]: 10 },
      source: 'ville',
      control: 160.3,
    })
  })

  test('falls back to the DGFiP total for a year missing from city files', () => {
    expect(rows[1]).toEqual({
      year: 2017,
      total: 1399468.62,
      byGroup: { [UNALLOCATED_GROUP]: 1399468.62 },
      source: 'dgfip',
      control: 1399468.62,
    })
  })

  test('keeps years sorted and leaves control empty when unknown', () => {
    expect(rows.map((row) => row.year)).toEqual([2016, 2017, 2018])
    expect(rows[2]?.control).toBeUndefined()
  })

  test('orders only the groups that appear', () => {
    expect(groupOrder(eau, rows)).toEqual([
      'administration',
      'espaces-verts',
      'cimetieres',
      OTHER_GROUP,
      UNALLOCATED_GROUP,
    ])
  })
})

describe('changeRatio', () => {
  test('computes a relative change', () => {
    expect(changeRatio(150, 100)).toBeCloseTo(0.5)
    expect(changeRatio(150, 0)).toBeUndefined()
    expect(changeRatio(150, undefined)).toBeUndefined()
  })
})
