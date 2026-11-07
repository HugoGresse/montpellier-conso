import { describe, expect, test } from 'bun:test'
import { niceTicks, stackBars, topRoundedRect } from './chart'

describe('niceTicks', () => {
  test('rounds the axis up to a readable step', () => {
    expect(niceTicks(1_802_690)).toEqual([0, 500_000, 1_000_000, 1_500_000, 2_000_000])
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100])
  })

  test('handles an empty series', () => {
    expect(niceTicks(0)).toEqual([0])
  })
})

describe('stackBars', () => {
  const area = { left: 0, top: 0, width: 200, height: 100 }

  test('stacks groups from the baseline in the given order', () => {
    const [bar] = stackBars([{ year: 2020, byGroup: { a: 50, b: 25 } }], ['a', 'b'], area, 100)
    expect(bar?.segments).toEqual([
      { groupId: 'a', y: 50, height: 48, isTop: false },
      { groupId: 'b', y: 25, height: 25, isTop: true },
    ])
  })

  test('skips empty groups and centres the bar in its slot', () => {
    const bars = stackBars(
      [
        { year: 2020, byGroup: { a: 10, b: 0 } },
        { year: 2021, byGroup: { b: 10 } },
      ],
      ['a', 'b'],
      area,
      100,
    )
    expect(bars[0]?.segments.map((s) => s.groupId)).toEqual(['a'])
    expect(bars[1]?.slotX).toBe(100)
    expect(bars[1]?.x).toBe(100 + (100 - 28) / 2)
  })
})

describe('topRoundedRect', () => {
  test('never rounds more than the bar height', () => {
    expect(topRoundedRect(0, 0, 10, 2)).toBe('M0,2 V2 Q0,0 2,0 H8 Q10,0 10,2 V2 Z')
  })
})
