import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

function truncate(value, length = 18) {
  const next = String(value || "pending")
  return next.length > length ? `${next.slice(0, length - 1)}…` : next
}

export function PathwayFlowDiagram({ model, lang = "zh", withTestId = true }) {
  const rows = asArray(model?.rows)
  if (!rows.length) {
    return <div data-testid={withTestId ? "pathway-flow-diagram" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const maxEvidence = Math.max(1, ...rows.map(row => Number(row.evidenceCount) || 0))
  const width = 780
  const height = Math.max(220, rows.length * 42 + 54)
  const start = { x: 42, y: height / 2 }
  const end = { x: 718, y: height / 2 }
  return (
    <div data-testid={withTestId ? "pathway-flow-diagram" : undefined} data-row-count={rows.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "反应路径流图", "Reaction Pathway Flow Diagram")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "边宽按 evidence count 缩放；风险步骤使用风险色。", "Edge width is scaled by evidence count; risk steps use the risk tone.")}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text(lang, "反应路径流图", "Reaction pathway flow diagram")} style={{ minWidth: 620, width: "100%", height: "auto" }}>
        <rect x={start.x - 28} y={start.y - 20} width="76" height="40" rx="8" fill={palette.accentSoft} stroke={palette.accent} />
        <text x={start.x + 10} y={start.y + 4} fill={palette.accent} fontSize="12" fontWeight="950" textAnchor="middle">CO2</text>
        <rect x={end.x - 54} y={end.y - 20} width="96" height="40" rx="8" fill={palette.positiveSoft} stroke={palette.positive} />
        <text x={end.x - 6} y={end.y + 4} fill={palette.positive} fontSize="11.5" fontWeight="950" textAnchor="middle">{text(lang, "有机酸", "Organic acid")}</text>
        {rows.map((row, index) => {
          const y = 34 + index * 42
          const stroke = row.riskFlag ? palette.risk : palette.accent
          const strokeWidth = 2 + ((Number(row.evidenceCount) || 0) / maxEvidence) * 8
          return (
            <g key={row.id}>
              <path d={`M ${start.x + 48} ${start.y} C 190 ${start.y}, 190 ${y}, 292 ${y}`} fill="none" stroke={stroke} strokeOpacity="0.36" strokeWidth={strokeWidth} />
              <path d={`M 488 ${y} C 590 ${y}, 590 ${end.y}, ${end.x - 56} ${end.y}`} fill="none" stroke={stroke} strokeOpacity="0.36" strokeWidth={strokeWidth} />
              <rect x="292" y={y - 16} width="196" height="32" rx="8" fill={row.riskFlag ? palette.riskSoft : palette.surfaceStrong} stroke={row.riskFlag ? palette.risk : palette.borderStrong} />
              <text x="302" y={y - 2} fill={palette.text} fontSize="10.5" fontWeight="850">{truncate(text(lang, row.labelZh, row.labelEn), 26)}</text>
              <text x="302" y={y + 12} fill={palette.faint} fontSize="9.5">{row.evidenceCount} ev · {row.confidenceLevel} · {fmt(row.confidenceValue, 2)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default PathwayFlowDiagram
