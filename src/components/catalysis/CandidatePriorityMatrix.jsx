import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const tierColor = {
  high: palette.positive,
  medium: palette.mixed,
  low: palette.risk,
}

export function CandidatePriorityMatrix({ rows, selectedCandidateId, onSelectCandidate, lang }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 14 }}>{text(lang, "优先级矩阵", "Priority Matrix")}</strong>
        <span style={{ color: palette.muted, fontSize: 12 }}>{text(lang, "X 轴为路径相关性，Y 轴为证据就绪度；点大小为 MOF 可行性分。", "X axis is pathway relevance, Y axis is evidence readiness; point size represents MOF feasibility.")}</span>
      </header>
      <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, overflowX: "auto", padding: 8 }}>
        <svg viewBox="0 0 560 350" style={{ display: "block", minWidth: 520, width: "100%" }}>
          <rect x="54" y="22" width="450" height="280" rx="8" fill="#fff" stroke={palette.border} />
          <line x1="279" y1="22" x2="279" y2="302" stroke={palette.border} strokeDasharray="5 5" />
          <line x1="54" y1="162" x2="504" y2="162" stroke={palette.border} strokeDasharray="5 5" />
          <text x="66" y="47" fill={palette.positive} fontSize="12" fontWeight="900">{text(lang, "优先补数据", "Priority data completion")}</text>
          <text x="314" y="47" fill={palette.positive} fontSize="12" fontWeight="900">{text(lang, "优先验证", "Priority validation")}</text>
          <text x="66" y="287" fill={palette.faint} fontSize="12" fontWeight="850">{text(lang, "暂缓", "Defer")}</text>
          <text x="326" y="287" fill={palette.muted} fontSize="12" fontWeight="850">{text(lang, "可作对照", "Control candidate")}</text>
          <text x="230" y="335" fill={palette.muted} fontSize="12" fontWeight="850">{text(lang, "路径相关性", "Pathway relevance")}</text>
          <text x="18" y="178" fill={palette.muted} fontSize="12" fontWeight="850" transform="rotate(-90 18 178)">{text(lang, "证据就绪度", "Evidence readiness")}</text>
          {rows.map(row => {
            const x = 54 + Math.max(0, Math.min(1, row.pathwayRelevance)) * 450
            const y = 302 - Math.max(0, Math.min(1, row.evidenceReadiness)) * 280
            const active = selectedCandidateId === row.id
            return (
              <g key={row.id} onClick={() => onSelectCandidate(row.id)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={10 + (row.feasibilityScore || 0) * 12} fill={tierColor[row.priorityTier] || palette.accent} opacity={active ? 0.95 : 0.75} stroke={active ? "#0F4C81" : "#fff"} strokeWidth={active ? 4 : 2} />
                <text x={x + 16} y={y - 10} fill={palette.text} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="11" fontWeight="900">{row.name}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
