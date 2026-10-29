export type ForecastPoint = { t: number; p: number }
export const DAY = 86_400_000

export function formatHistoryDate(t: number, withTime = false) {
  if (!Number.isFinite(t)) return '—'
  const value = new Date(t).toISOString()
  return withTime ? `${value.slice(0, 10)} ${value.slice(11, 19)} UTC` : value.slice(0, 10)
}

export function summarizeHistory(points: ForecastPoint[]) {
  if (!points.length) return null
  const first = points[0], last = points[points.length - 1]
  let low = first, high = first, maxGap = 0
  const changes: { before: ForecastPoint; after: ForecastPoint; delta: number; gap: number }[] = []
  points.forEach((point, i) => {
    if (point.p < low.p) low = point
    if (point.p > high.p) high = point
    if (i) {
      const previous = points[i - 1], gap = point.t - previous.t
      maxGap = Math.max(maxGap, gap)
      changes.push({ before: previous, after: point, delta: (point.p - previous.p) * 100, gap })
    }
  })
  return { first, last, low, high, change: (last.p - first.p) * 100,
    count: points.length, span: last.t - first.t, maxGap,
    largestMoves: changes.filter(c => c.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5) }
}

export function historyWindow(points: ForecastPoint[], cutoff: number, hours: number, anchor: 'trade' | 'archive', from = '', to = '') {
  const valid = points.filter(p => Number.isFinite(p.t) && Number.isFinite(p.p) && p.p >= 0 && p.p <= 1 && p.t < cutoff)
  const end = anchor === 'trade' && valid.length ? valid[valid.length - 1].t : cutoff - 1
  const start = hours ? end - hours * 3_600_000 : valid[0]?.t ?? end
  const lower = from ? Date.parse(`${from}T00:00:00Z`) : start
  const upper = to ? Date.parse(`${to}T00:00:00Z`) + DAY - 1 : end
  const invalid = !Number.isFinite(lower) || !Number.isFinite(upper) || lower > upper
  return { points: invalid ? [] : valid.filter(p => p.t >= lower && p.t <= upper), start: lower, end: upper, invalid }
}

/** Conservative UTC envelope for a verified calendar date whose source timezone is unknown. */
export function publicationNeighbors(points: ForecastPoint[], publicationDate: string, cutoff: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)) return null
  const day = Date.parse(`${publicationDate}T00:00:00Z`)
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0,10) !== publicationDate) return null
  const earliest = day - 14 * 3_600_000, latest = day + DAY + 14 * 3_600_000
  const valid = points.filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1&&p.t<cutoff).sort((a,b)=>a.t-b.t)
  const before = valid.filter(p => p.t >= earliest - 7 * DAY && p.t < earliest)
  const after = valid.filter(p => p.t >= latest && p.t < latest + 7 * DAY)
  return { before: before[before.length - 1] ?? null, after: after[0] ?? null,
    afterCutoff: earliest >= cutoff, beforeHistory: !!valid.length && latest <= valid[0].t,
    delta: before.length && after.length ? (after[0].p - before[before.length - 1]!.p) * 100 : null }
}
