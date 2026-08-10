import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

const SERIES_TONES = [palette.positive, palette.accent, palette.mixed || palette.faint]

export function GuestDumbbellChart({ models, model, lang = "zh", withTestId = true }) {
  const series = asArray(models).length ? asArray(models) : (model ? [model] : [])
  if (!series.length) {
    return <div data-testid={withTestId ? "guest-dumbbell-chart" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const factorKeys = asArray(series[0].rows).map(row => row.fieldKey)
  const labelByKey = new Map(asArray(series[0].rows).map(row => [row.fieldKey, [row.labelZh, row.labelEn]]))
  const width = 320
  const left = 28
  const right = 292
  const rowGap = 58
  const axisTop = 28
  const height = factorKeys.length * rowGap + 54
  const xOf = value => left + Math.max(0, Math.min(1, Number(value) || 0)) * (right - left)
  const chipX = x => Math.max(left, Math.min(right - 30, x > right - 42 ? x - 38 : x + 8))
  const competitorCount = Math.max(0, series.length - 1)
  return (
    <div data-testid={withTestId ? "guest-dumbbell-chart" : undefined} data-row-count={factorKeys.length} data-series-count={series.length} style={cardStyle({ background: palette.bg, overflow: "hidden" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "客体七因子哑铃图", "Guest Seven-Factor Dumbbell Chart")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, `选中客体与前 ${competitorCount} 个竞争客体并排对比。`, `Selected guest compared with the top ${competitorCount} competing guest(s).`)}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {series.map((entry, index) => (
          <span key={entry.candidateLabel} style={{ alignItems: "center", color: palette.text, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6 }}>
            <span style={{ background: SERIES_TONES[index] || palette.faint, borderRadius: 6, height: 9, width: 9 }} />
            #{entry.rank} {entry.candidateLabel} · {fmt(entry.finalValue, 3)}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={text(lang, "客体七因子哑铃图", "Guest seven-factor dumbbell chart")} style={{ width: "100%", height: "auto", maxWidth: "100%" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <g key={tick}>
            <line x1={xOf(tick)} y1={axisTop} x2={xOf(tick)} y2={height - 22} stroke={palette.border} strokeDasharray={tick === 0 || tick === 1 ? "0" : "3 4"} />
            <text x={xOf(tick)} y="15" fill={palette.faint} fontSize="8.5" textAnchor="middle">{fmt(tick, 2)}</text>
          </g>
        ))}
        {factorKeys.map((key, index) => {
          const y = 46 + index * rowGap
          const [labelZh, labelEn] = labelByKey.get(key) || [key, key]
          const values = series.map(entry => {
            const cell = asArray(entry.rows).find(row => row.fieldKey === key) || {}
            return { entry, value: Number(cell.normalizedValue) || 0 }
          })
          const minX = Math.min(...values.map(row => xOf(row.value)))
          const maxX = Math.max(...values.map(row => xOf(row.value)))
          return (
            <g key={key}>
              <text x={left} y={y - 18} fill={palette.text} fontSize="9.8" fontWeight="850">{text(lang, labelZh, labelEn)}</text>
              <line x1={left} y1={y} x2={right} y2={y} stroke={palette.border} strokeWidth="4" strokeLinecap="round" />
              <line x1={minX} y1={y} x2={maxX} y2={y} stroke={palette.borderStrong} strokeWidth="2" />
              {values.map((row, seriesIndex) => {
                const x = xOf(row.value)
                const labelX = chipX(x)
                return (
                  <g key={`${key}-${row.entry.candidateLabel}`}>
                    <rect x={labelX - 2} y={y + 8 + seriesIndex * 13} width="34" height="11" rx="5.5" fill={palette.surfaceStrong} stroke={SERIES_TONES[seriesIndex] || palette.faint} strokeWidth="0.7" opacity="0.96" />
                    <text x={labelX + 15} y={y + 17 + seriesIndex * 13} fill={palette.text} fontSize="7.4" fontWeight="850" textAnchor="middle">{fmt(row.value, 2)}</text>
                    <circle data-testid="guest-dumbbell-point" data-cx={fmt(x, 2)} cx={x} cy={y} r={seriesIndex === 0 ? 5.6 : 4.8} fill={SERIES_TONES[seriesIndex] || palette.faint} stroke={palette.bg} strokeWidth="1.5" />
                  <title>{row.entry.candidateLabel}: {fmt(row.value, 3)}</title>
                </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default GuestDumbbellChart
