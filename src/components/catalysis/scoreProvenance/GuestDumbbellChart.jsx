import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

const SERIES_TONES = [palette.positive, palette.accent, palette.mixed || palette.faint]

export function GuestDumbbellChart({ models, model, lang = "zh", withTestId = true }) {
  const series = asArray(models).length ? asArray(models) : (model ? [model] : [])
  if (!series.length) {
    return <div data-testid={withTestId ? "guest-dumbbell-chart" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const factorKeys = asArray(series[0].rows).map(row => row.fieldKey)
  const labelByKey = new Map(asArray(series[0].rows).map(row => [row.fieldKey, [row.labelZh, row.labelEn]]))
  const width = 660
  const left = 178
  const right = 610
  const rowGap = 40
  const height = factorKeys.length * rowGap + 54
  const xOf = value => left + Math.max(0, Math.min(1, Number(value) || 0)) * (right - left)
  const competitorCount = Math.max(0, series.length - 1)
  return (
    <div data-testid={withTestId ? "guest-dumbbell-chart" : undefined} data-row-count={factorKeys.length} data-series-count={series.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "客体七因子哑铃图", "Guest Seven-Factor Dumbbell Chart")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, `选中客体与前 ${competitorCount} 个竞争客体并排对比。`, `Selected guest compared with the top ${competitorCount} competing guest(s).`)}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {series.map((entry, index) => (
          <span key={entry.candidateLabel} style={{ alignItems: "center", color: palette.text, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6 }}>
            <span style={{ background: SERIES_TONES[index] || palette.faint, borderRadius: 999, height: 9, width: 9 }} />
            #{entry.rank} {entry.candidateLabel} · {fmt(entry.finalValue, 3)}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text(lang, "客体七因子哑铃图", "Guest seven-factor dumbbell chart")} style={{ minWidth: 560, width: "100%", height: "auto" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <g key={tick}>
            <line x1={xOf(tick)} y1="18" x2={xOf(tick)} y2={height - 24} stroke={palette.border} strokeDasharray={tick === 0 || tick === 1 ? "0" : "3 4"} />
            <text x={xOf(tick)} y="12" fill={palette.faint} fontSize="9" textAnchor="middle">{fmt(tick, 2)}</text>
          </g>
        ))}
        {factorKeys.map((key, index) => {
          const y = 34 + index * rowGap
          const [labelZh, labelEn] = labelByKey.get(key) || [key, key]
          const values = series.map(entry => {
            const cell = asArray(entry.rows).find(row => row.fieldKey === key) || {}
            return { entry, value: Number(cell.normalizedValue) || 0 }
          })
          const minX = Math.min(...values.map(row => xOf(row.value)))
          const maxX = Math.max(...values.map(row => xOf(row.value)))
          return (
            <g key={key}>
              <text x="12" y={y + 4} fill={palette.text} fontSize="10.5" fontWeight="850">{text(lang, labelZh, labelEn)}</text>
              <line x1={minX} y1={y} x2={maxX} y2={y} stroke={palette.borderStrong} strokeWidth="2" />
              {values.map((row, seriesIndex) => (
                <g key={`${key}-${row.entry.candidateLabel}`}>
                  <circle cx={xOf(row.value)} cy={y} r={seriesIndex === 0 ? 6 : 5} fill={SERIES_TONES[seriesIndex] || palette.faint} stroke={palette.bg} strokeWidth="1.5" />
                  <title>{row.entry.candidateLabel}: {fmt(row.value, 3)}</title>
                </g>
              ))}
              <text x={right + 10} y={y + 4} fill={palette.muted} fontSize="10">{fmt(values[0]?.value, 2)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default GuestDumbbellChart
