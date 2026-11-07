import type { YearRow } from './aggregate'
import { niceTicks, type Series, stackBars, topRoundedRect } from './chart'
import { formatCompactEuros, formatEuros } from './format'

export const CHART_WIDTH = 720
export const CHART_HEIGHT = 380
const AREA = { left: 64, top: 28, width: CHART_WIDTH - 64 - 12, height: CHART_HEIGHT - 28 - 36 }
const BASELINE = AREA.top + AREA.height

const roundCents = (value: number) => Math.round(value * 100) / 100

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

export function selectRows(rows: YearRow[], selected: ReadonlySet<string>): YearRow[] {
  return rows.map((row) => {
    const byGroup = Object.fromEntries(
      Object.entries(row.byGroup).filter(([id]) => selected.has(id)),
    )
    const total = roundCents(Object.values(byGroup).reduce((sum, value) => sum + value, 0))
    return { ...row, byGroup, total }
  })
}

export function parseSelection(raw: string | null, series: Series[]): Set<string> {
  const known = new Set(series.map((s) => s.id))
  const picked = (raw ?? '').split(',').filter((id) => known.has(id))
  return new Set(picked.length > 0 ? picked : known)
}

export function serializeSelection(selected: ReadonlySet<string>, series: Series[]): string | null {
  const all = series.every((s) => selected.has(s.id))
  return all
    ? null
    : series
        .filter((s) => selected.has(s.id))
        .map((s) => s.id)
        .join(',')
}

export function toggleSelection(selected: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(selected)
  if (!next.has(id)) return next.add(id)
  if (next.size === 1) return selected
  next.delete(id)
  return next
}

function fillOf(series: Series | undefined): string {
  if (!series) return 'var(--series-neutral)'
  return series.hatched ? 'url(#hatch)' : series.color
}

export function renderChartSvg(
  allRows: YearRow[],
  series: Series[],
  selected: ReadonlySet<string>,
  caption: string,
): string {
  const rows = selectRows(allRows, selected)
  const ticks = niceTicks(Math.max(0, ...rows.map((row) => row.total)))
  const maxTick = ticks.at(-1) || 1
  const order = series.filter((s) => selected.has(s.id)).map((s) => s.id)
  const byId = new Map(series.map((s) => [s.id, s]))
  const bars = stackBars(rows, order, AREA, maxTick)
  const yOf = (value: number) => BASELINE - (value / maxTick) * AREA.height

  const tickMarkup = ticks
    .map((tick) => {
      const y = yOf(tick)
      const label = tick === 0 ? '0' : formatCompactEuros(tick)
      return `<g class="tick"><line x1="${AREA.left}" x2="${AREA.left + AREA.width}" y1="${y}" y2="${y}"/><text x="${AREA.left - 8}" y="${y}" dy="0.35em" text-anchor="end">${escapeXml(label)}</text></g>`
    })
    .join('')

  const barMarkup = bars
    .map((bar, index) => {
      const row = rows[index]
      const segments = bar.segments
        .map((segment) => {
          const fill = fillOf(byId.get(segment.groupId))
          return segment.isTop
            ? `<path d="${topRoundedRect(bar.x, segment.y, bar.width, segment.height)}" fill="${fill}"/>`
            : `<rect x="${bar.x}" y="${segment.y}" width="${bar.width}" height="${segment.height}" fill="${fill}"/>`
        })
        .join('')
      const yearLabel =
        index % 2 === 0
          ? `<text class="year" x="${bar.x + bar.width / 2}" y="${BASELINE + 22}" text-anchor="middle">${bar.year}</text>`
          : ''
      const ariaLabel = escapeXml(`${bar.year} : ${formatEuros(row?.total ?? 0)}`)
      const hit = `<rect class="hit" x="${bar.slotX}" y="${AREA.top}" width="${bar.slotWidth}" height="${AREA.height + 28}" tabindex="0" role="button" aria-label="${ariaLabel}" data-index="${index}"/>`
      return `<g class="bar" data-index="${index}">${segments}${yearLabel}${hit}</g>`
    })
    .join('')

  const last = bars.at(-1)
  const lastRow = rows.at(-1)
  const directLabel =
    last && lastRow && lastRow.total > 0
      ? `<text class="direct-label" x="${last.x + last.width}" y="${yOf(lastRow.total) - 8}" text-anchor="end">${escapeXml(formatCompactEuros(lastRow.total))}</text>`
      : ''

  return [
    `<svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" role="img" aria-label="${escapeXml(caption)}">`,
    '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface-1)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--series-neutral)" stroke-width="3"/></pattern></defs>',
    tickMarkup,
    barMarkup,
    `<line class="baseline" x1="${AREA.left}" x2="${AREA.left + AREA.width}" y1="${BASELINE}" y2="${BASELINE}"/>`,
    directLabel,
    '</svg>',
  ].join('')
}
