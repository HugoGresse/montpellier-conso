import { describe, expect, test } from 'bun:test'
import type { YearRow } from './aggregate'
import type { Series } from './chart'
import {
  escapeXml,
  parseSelection,
  renderChartSvg,
  selectRows,
  serializeSelection,
  toggleSelection,
} from './chart-svg'

const series: Series[] = [
  { id: 'a', label: 'Admin', color: 'var(--series-1)' },
  { id: 'b', label: 'Espaces verts', color: 'var(--series-2)' },
  { id: 'c', label: 'Non ventilé', color: 'var(--series-neutral)', hatched: true },
]

const rows: YearRow[] = [
  { year: 2016, total: 300.5, byGroup: { a: 100.25, b: 200.25 }, source: 'ville', control: 300.5 },
  { year: 2017, total: 400, byGroup: { c: 400 }, source: 'dgfip', control: 400 },
]

describe('selectRows', () => {
  test('keeps only selected groups and recomputes totals', () => {
    expect(selectRows(rows, new Set(['b']))).toEqual([
      { year: 2016, total: 200.25, byGroup: { b: 200.25 }, source: 'ville', control: 300.5 },
      { year: 2017, total: 0, byGroup: {}, source: 'dgfip', control: 400 },
    ])
  })
})

describe('selection state', () => {
  test('parses known ids and falls back to every series', () => {
    expect([...parseSelection('b,unknown', series)]).toEqual(['b'])
    expect([...parseSelection(null, series)]).toEqual(['a', 'b', 'c'])
    expect([...parseSelection('nope', series)]).toEqual(['a', 'b', 'c'])
  })

  test('serialises in series order and omits the full selection', () => {
    expect(serializeSelection(new Set(['c', 'a']), series)).toBe('a,c')
    expect(serializeSelection(new Set(['a', 'b', 'c']), series)).toBeNull()
  })

  test('toggles a series but never empties the selection', () => {
    const only = new Set(['a'])
    expect(toggleSelection(only, 'a')).toBe(only)
    expect([...toggleSelection(only, 'b')]).toEqual(['a', 'b'])
    expect([...toggleSelection(new Set(['a', 'b']), 'a')]).toEqual(['b'])
  })
})

describe('renderChartSvg', () => {
  test('draws only the selected series, keeping their colours', () => {
    const svg = renderChartSvg(rows, series, new Set(['b']), 'Eau')
    expect(svg).toContain('fill="var(--series-2)"')
    expect(svg).not.toContain('fill="var(--series-1)"')
    expect(svg).not.toContain('fill="url(#hatch)"')
    expect(svg.match(/class="hit"/g)).toHaveLength(2)
  })

  test('escapes the caption', () => {
    expect(renderChartSvg(rows, series, new Set(['a']), 'a <b> & "c"')).toContain(
      'aria-label="a &#60;b&#62; &#38; &#34;c&#34;"',
    )
  })
})

describe('escapeXml', () => {
  test('escapes markup characters', () => {
    expect(escapeXml(`<'&">`)).toBe('&#60;&#39;&#38;&#34;&#62;')
  })
})
