import { useMemo, useState } from "react"
import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const tierColor = {
  high: palette.positive,
  medium: palette.mixed,
  low: palette.risk,
}

export function CandidatePriorityMatrix({ rows, selectedCandidateId, onSelectCandidate, lang }) {
  const [hoveredId, setHoveredId] = useState("")
  const layout = { left: 74, top: 44, width: 492, height: 236 }
  const midX = layout.left + layout.width / 2
  const midY = layout.top + layout.height / 2
  const points = useMemo(() => {
    const placed = []
    return rows.map((row, index) => {
      const x = layout.left + Math.max(0, Math.min(1, row.pathwayRelevance)) * layout.width
      const y = layout.top + (1 - Math.max(0, Math.min(1, row.evidenceReadiness))) * layout.height
      const right = x >= midX
      const bottom = y >= midY
      let labelX = x + (right ? 16 : -16)
      let labelY = y + (bottom ? 20 : -14)
      const anchor = right ? "start" : "end"
      placed.forEach(existing => {
        const closeX = Math.abs(existing.labelX - labelX) < 92
        const closeY = Math.abs(existing.labelY - labelY) < 20
        if (closeX && closeY) labelY += bottom ? 17 : -17
      })
      labelX = Math.max(layout.left + 8, Math.min(layout.left + layout.width - 8, labelX))
      labelY = Math.max(layout.top + 16, Math.min(layout.top + layout.height - 10, labelY))
      const point = {
        ...row,
        x,
        y,
        r: 8 + Math.max(0, Math.min(1, row.feasibilityScore || 0)) * 10,
        labelX,
        labelY,
        anchor,
        index,
      }
      placed.push(point)
      return point
    })
  }, [rows])
  const hovered = points.find(point => point.id === hoveredId)
  const selected = points.find(point => point.id === selectedCandidateId)
  const tooltipPoint = hovered || selected
  const pct = value => Number(value || 0).toFixed(2)

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 14 }}>{text(lang, "优先级矩阵", "Priority Matrix")}</strong>
        <span style={{ color: palette.muted, fontSize: 12 }}>{text(lang, "X 轴为路径相关性，Y 轴为证据就绪度；点大小为 MOF 可行性分，颜色表示优先级等级。", "X axis is pathway relevance, Y axis is evidence readiness; point size represents MOF feasibility, and color represents priority tier.")}</span>
      </header>
      <div style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 12, margin: "0 auto", maxWidth: 720, overflowX: "auto", padding: 10, position: "relative", width: "100%" }}>
        <svg viewBox="0 0 640 360" style={{ display: "block", height: "auto", minWidth: 560, width: "100%" }}>
          <rect x={layout.left} y={layout.top} width={layout.width / 2} height={layout.height / 2} fill="#F7FBFF" />
          <rect x={midX} y={layout.top} width={layout.width / 2} height={layout.height / 2} fill="#F2FBF6" />
          <rect x={layout.left} y={midY} width={layout.width / 2} height={layout.height / 2} fill="#FAFBFD" />
          <rect x={midX} y={midY} width={layout.width / 2} height={layout.height / 2} fill="#FFF7ED" />
          <rect x={layout.left} y={layout.top} width={layout.width} height={layout.height} rx="10" fill="none" stroke={palette.border} />
          <line x1={midX} y1={layout.top} x2={midX} y2={layout.top + layout.height} stroke="#CBD5E1" strokeDasharray="5 6" />
          <line x1={layout.left} y1={midY} x2={layout.left + layout.width} y2={midY} stroke="#CBD5E1" strokeDasharray="5 6" />
          {[0, 0.5, 1].map(tick => (
            <g key={`x-${tick}`}>
              <line x1={layout.left + tick * layout.width} y1={layout.top + layout.height} x2={layout.left + tick * layout.width} y2={layout.top + layout.height + 5} stroke="#94A3B8" />
              <text x={layout.left + tick * layout.width} y={layout.top + layout.height + 19} fill={palette.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10.5" textAnchor="middle">{tick.toFixed(1)}</text>
            </g>
          ))}
          {[0, 0.5, 1].map(tick => (
            <g key={`y-${tick}`}>
              <line x1={layout.left - 5} y1={layout.top + (1 - tick) * layout.height} x2={layout.left} y2={layout.top + (1 - tick) * layout.height} stroke="#94A3B8" />
              <text x={layout.left - 12} y={layout.top + (1 - tick) * layout.height + 4} fill={palette.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10.5" textAnchor="end">{tick.toFixed(1)}</text>
            </g>
          ))}
          <text x={layout.left} y={layout.top - 18} fill={palette.muted} fontSize="12" fontWeight="850">{text(lang, "证据就绪度", "Evidence readiness")}</text>
          <text x={layout.left + layout.width / 2} y={layout.top + layout.height + 42} fill={palette.muted} fontSize="12" fontWeight="850" textAnchor="middle">{text(lang, "路径相关性", "Pathway relevance")}</text>
          <text x={layout.left} y={layout.top + layout.height + 42} fill={palette.faint} fontSize="10.5">{text(lang, "低路径相关性", "Low relevance")}</text>
          <text x={layout.left + layout.width} y={layout.top + layout.height + 42} fill={palette.faint} fontSize="10.5" textAnchor="end">{text(lang, "高路径相关性", "High relevance")}</text>
          <text x={midX + 14} y={layout.top + 20} fill={palette.positive} fontSize="11.5" fontWeight="900">{text(lang, "优先验证", "Prioritize validation")}</text>
          <text x={midX + 14} y={midY + 20} fill={palette.mixed} fontSize="11.5" fontWeight="900">{text(lang, "优先补数据", "Fill evidence first")}</text>
          <text x={layout.left + 14} y={layout.top + 20} fill={palette.accent} fontSize="11.5" fontWeight="900">{text(lang, "可作对照", "Use as control")}</text>
          <text x={layout.left + 14} y={midY + 20} fill={palette.faint} fontSize="11.5" fontWeight="900">{text(lang, "暂缓", "Defer")}</text>
          {points.map(point => {
            const active = selectedCandidateId === point.id
            const hoveredPoint = hoveredId === point.id
            const color = tierColor[point.priorityTier] || palette.accent
            return (
              <g
                key={point.id}
                onClick={() => onSelectCandidate(point.id)}
                onMouseEnter={() => setHoveredId(point.id)}
                onMouseLeave={() => setHoveredId("")}
                style={{ cursor: "pointer" }}
              >
                {active ? <circle cx={point.x} cy={point.y} r={point.r + 7} fill={color} opacity="0.14" /> : null}
                <circle cx={point.x} cy={point.y} r={point.r} fill={color} opacity={active || hoveredPoint ? 0.88 : 0.68} stroke={active ? "#0F4C81" : color} strokeWidth={active ? 3.2 : 1.6} />
                <line x1={point.x} y1={point.y} x2={point.labelX + (point.anchor === "start" ? -4 : 4)} y2={point.labelY - 4} stroke="#94A3B8" strokeWidth="0.8" opacity="0.45" />
                <text x={point.labelX} y={point.labelY} fill={active ? "#0F4C81" : palette.text} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="11.5" fontWeight={active ? "900" : "800"} textAnchor={point.anchor}>{point.name}</text>
              </g>
            )
          })}
          <g transform="translate(74 320)">
            {[
              ["high", text(lang, "高优先级", "High")],
              ["medium", text(lang, "中等优先级", "Medium")],
              ["low", text(lang, "低优先级", "Low")],
            ].map(([tier, label], index) => (
              <g key={tier} transform={`translate(${index * 118} 0)`}>
                <circle cx="8" cy="8" r="6" fill={tierColor[tier]} opacity="0.72" stroke={tierColor[tier]} />
                <text x="20" y="12" fill={palette.muted} fontSize="10.5">{label}</text>
              </g>
            ))}
            <circle cx="388" cy="8" r="5" fill="none" stroke={palette.faint} />
            <circle cx="416" cy="8" r="11" fill="none" stroke={palette.faint} />
            <text x="434" y="12" fill={palette.muted} fontSize="10.5">{text(lang, "气泡大小 = MOF 可行性", "Bubble size = MOF feasibility")}</text>
          </g>
        </svg>
        {tooltipPoint ? (
          <div style={{
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${palette.border}`,
            borderRadius: 9,
            boxShadow: "0 12px 28px rgba(15,23,42,0.14)",
            color: palette.muted,
            fontSize: 11.5,
            left: `${Math.min(76, Math.max(8, (tooltipPoint.x / 640) * 100))}%`,
            lineHeight: 1.5,
            padding: "8px 10px",
            pointerEvents: "none",
            position: "absolute",
            top: `${Math.min(70, Math.max(10, (tooltipPoint.y / 360) * 100))}%`,
            transform: "translate(8px, -8px)",
            zIndex: 3,
          }}>
            <strong style={{ color: palette.text, display: "block", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.5 }}>{tooltipPoint.name}</strong>
            {text(lang, "路径相关性", "Pathway relevance")}: {pct(tooltipPoint.pathwayRelevance)}<br />
            {text(lang, "证据就绪度", "Evidence readiness")}: {pct(tooltipPoint.evidenceReadiness)}<br />
            {text(lang, "MOF 可行性", "MOF feasibility")}: {pct(tooltipPoint.feasibilityScore)}<br />
            {text(lang, "优先级", "Priority tier")}: {tooltipPoint.priorityTier}
          </div>
        ) : null}
      </div>
    </section>
  )
}
