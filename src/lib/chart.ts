export interface Series {
  id: string
  label: string
  color: string
  hatched?: boolean
}

export interface Segment {
  groupId: string
  y: number
  height: number
  isTop: boolean
}

export interface BarLayout {
  year: number
  x: number
  width: number
  slotX: number
  slotWidth: number
  segments: Segment[]
}

export interface StackInput {
  year: number
  byGroup: Record<string, number>
}

export interface PlotArea {
  left: number
  top: number
  width: number
  height: number
}

const SEGMENT_GAP = 2

export function niceTicks(max: number, targetCount = 4): number[] {
  if (max <= 0) return [0]
  const rawStep = max / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep
  const count = Math.ceil(max / step)
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6)
}

export function stackBars(
  rows: StackInput[],
  order: string[],
  area: PlotArea,
  maxValue: number,
): BarLayout[] {
  const slotWidth = area.width / rows.length
  const barWidth = Math.min(28, slotWidth * 0.64)
  const scale = (value: number) => (value / maxValue) * area.height

  return rows.map((row, index) => {
    const slotX = area.left + index * slotWidth
    const present = order.filter((id) => (row.byGroup[id] ?? 0) > 0)
    let cursor = area.top + area.height
    const segments = present.map((groupId, position): Segment => {
      const fullHeight = scale(row.byGroup[groupId] ?? 0)
      const isTop = position === present.length - 1
      const height = Math.max(isTop ? fullHeight : fullHeight - SEGMENT_GAP, 0.5)
      cursor -= fullHeight
      return { groupId, y: cursor, height, isTop }
    })
    return {
      year: row.year,
      x: slotX + (slotWidth - barWidth) / 2,
      width: barWidth,
      slotX,
      slotWidth,
      segments,
    }
  })
}

export function topRoundedRect(x: number, y: number, width: number, height: number, radius = 4) {
  const r = Math.min(radius, width / 2, height)
  const bottom = y + height
  return [
    `M${x},${bottom}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${bottom}`,
    'Z',
  ].join(' ')
}
