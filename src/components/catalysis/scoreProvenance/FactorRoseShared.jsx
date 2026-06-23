import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

function polar(cx, cy, radius, angle) {
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function wedgePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const outerStart = polar(cx, cy, outerRadius, startAngle)
  const outerEnd = polar(cx, cy, outerRadius, endAngle)
  const innerEnd = polar(cx, cy, innerRadius, endAngle)
  const innerStart = polar(cx, cy, innerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ")
}

function truncate(value, length = 12) {
  const next = String(value || "pending")
  return next.length > length ? `${next.slice(0, length - 1)}…` : next
}

export function FactorRoseChart({ rows, titleZh, titleEn, subtitleZh, subtitleEn, centerLabel, centerValue, lang = "zh", testId, colorFor, outlineRows = [] }) {
  const dataRows = asArray(rows)
  if (!dataRows.length) {
    return (
      <div data-testid={testId} data-row-count={0} style={cardStyle({ background: palette.bg })}>
        <EmptyState lang={lang} />
      </div>
    )
  }
  const cx = 132
  const cy = 132
  const innerRadius = 32
  const radiusSpan = 78
  const gap = 3
  const step = 360 / dataRows.length
  const outlinePoints = asArray(outlineRows).map((row, index) => {
    const angle = index * step + step / 2
    const radius = innerRadius + radiusSpan * Math.max(0.04, Math.min(1, Number(row.value) || 0))
    return polar(cx, cy, radius, angle)
  })
  return (
    <div data-testid={testId} data-row-count={dataRows.length} style={cardStyle({ background: palette.bg })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, titleZh, titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, subtitleZh, subtitleEn)}</span>
      </div>
      <svg viewBox="0 0 264 264" role="img" aria-label={text(lang, titleZh, titleEn)} style={{ width: "100%", maxHeight: 290 }}>
        {[0.25, 0.5, 0.75, 1].map(level => (
          <circle key={level} cx={cx} cy={cy} r={innerRadius + radiusSpan * level} fill="none" stroke={palette.border} strokeDasharray="3 4" strokeWidth="1" />
        ))}
        {dataRows.map((row, index) => {
          const start = index * step + gap / 2
          const end = (index + 1) * step - gap / 2
          const value = Math.max(0.04, Math.min(1, Number(row.value) || 0))
          const outerRadius = innerRadius + radiusSpan * value
          const labelPoint = polar(cx, cy, innerRadius + radiusSpan + 19, start + (end - start) / 2)
          const fill = colorFor?.(row, index) || palette.accent
          return (
            <g key={row.factorKey || row.labelZh || index}>
              <path data-testid="factor-rose-wedge" d={wedgePath(cx, cy, innerRadius, outerRadius, start, end)} fill={fill} opacity="0.82" stroke={palette.bg} strokeWidth="1" />
              <text x={labelPoint.x} y={labelPoint.y} fill={palette.faint} fontSize="9" fontWeight="800" textAnchor={labelPoint.x >= cx ? "start" : "end"} dominantBaseline="middle">
                {truncate(text(lang, row.labelZh, row.labelEn), 11)}
              </text>
              <title>{text(lang, row.labelZh, row.labelEn)}: {fmt(row.value, 3)}</title>
            </g>
          )
        })}
        {outlinePoints.length === dataRows.length ? (
          <polygon points={outlinePoints.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke={palette.borderStrong} strokeDasharray="4 4" strokeWidth="2" opacity="0.9" />
        ) : null}
        <circle cx={cx} cy={cy} r={innerRadius - 3} fill={palette.surfaceStrong} stroke={palette.border} />
        <text x={cx} y={cy - 4} fill={palette.faint} fontSize="9.5" fontWeight="900" textAnchor="middle">{centerLabel}</text>
        <text x={cx} y={cy + 12} fill={palette.text} fontSize="17" fontWeight="950" textAnchor="middle">{centerValue}</text>
      </svg>
      <div style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {dataRows.map(row => (
          <div key={row.factorKey || row.labelZh} style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "minmax(0,1fr) 40px" }}>
            <span style={{ color: palette.muted, fontSize: 10.8, minWidth: 0 }}>{text(lang, row.labelZh, row.labelEn)}</span>
            <span style={{ color: palette.text, fontSize: 10.8, fontWeight: 900, textAlign: "right" }}>{fmt(row.value, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
