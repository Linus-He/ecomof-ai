// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const barData = [
  { name: "stability", value: 0.28 },
  { name: "uptake", value: 0.24 },
  { name: "selectivity", value: 0.21 },
  { name: "evidence", value: 0.17 },
  { name: "risk", value: 0.10 },
]

const lineData = [
  { x: -20, y: 0.66 },
  { x: -10, y: 0.69 },
  { x: 0, y: 0.71 },
  { x: 10, y: 0.70 },
  { x: 20, y: 0.67 },
]

const scatterData = [
  { x: 0.35, y: 0.42, z: 80 },
  { x: 0.52, y: 0.68, z: 160 },
  { x: 0.72, y: 0.58, z: 120 },
  { x: 0.86, y: 0.79, z: 210 },
]

function AxisFrame({ t, children }) {
  return (
    <svg viewBox="0 0 320 150" role="img" style={{ display: "block", height: 150, width: "100%" }}>
      <rect x="0" y="0" width="320" height="150" rx="8" fill={t.panel} />
      {[0, 1, 2, 3].map(index => (
        <line key={index} x1="34" x2="298" y1={24 + index * 30} y2={24 + index * 30} stroke={t.border} strokeDasharray="3 5" />
      ))}
      <line x1="34" x2="34" y1="18" y2="124" stroke={t.border} />
      <line x1="34" x2="298" y1="124" y2="124" stroke={t.border} />
      {children}
    </svg>
  )
}

function MiniChart({ type, t }) {
  if (type === "line") {
    const points = lineData.map((row, index) => {
      const x = 44 + index * 58
      const y = 124 - row.y * 96
      return { ...row, x, y }
    })
    const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")
    return (
      <AxisFrame t={t}>
        <path d={path} fill="none" stroke={t.accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map(point => <circle key={point.x} cx={point.x} cy={point.y} r="4" fill={t.surface} stroke={t.accent} strokeWidth="2" />)}
        <text x="36" y="140" fill={t.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10">-20</text>
        <text x="268" y="140" fill={t.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10">+20</text>
      </AxisFrame>
    )
  }
  if (type === "scatter") {
    return (
      <AxisFrame t={t}>
        <rect x="190" y="22" width="84" height="44" rx="8" fill={t.badgeInfoBg} stroke={t.accent} opacity="0.72" />
        {scatterData.map((row, index) => (
          <circle
            key={`${row.x}-${row.y}`}
            cx={34 + row.x * 264}
            cy={124 - row.y * 96}
            r={5 + index}
            fill={index % 2 ? t.success || t.accent : t.accent}
            opacity="0.88"
          />
        ))}
        <text x="38" y="140" fill={t.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10">0</text>
        <text x="288" y="140" fill={t.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="10">1</text>
      </AxisFrame>
    )
  }
  if (type === "bar") {
    const maxValue = Math.max(...barData.map(row => row.value), 1)
    return (
      <AxisFrame t={t}>
        {barData.map((row, index) => {
          const height = Math.max(8, (row.value / maxValue) * 92)
          const x = 48 + index * 49
          return (
            <g key={row.name}>
              <rect x={x} y={124 - height} width="28" height={height} rx="5" fill={t.accent} opacity={0.72 + index * 0.04} />
              <text x={x + 14} y="140" fill={t.faint} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="9" textAnchor="middle">{row.name.slice(0, 3)}</text>
            </g>
          )
        })}
      </AxisFrame>
    )
  }
  return (
    <div style={{ alignItems: "center", background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12, minHeight: 118, padding: 12, textAlign: "center" }}>
      {type === "flow" ? "Data → provenance → comparison → validation" : "score / tier / evidence view"}
    </div>
  )
}

export function MethodVisualizationCard({ visualization, lang, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
      <div>
        <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5, lineHeight: 1.3 }}>
          <ChemicalText value={text(lang, visualization.titleZh, visualization.title)} />
        </strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5, margin: "5px 0 0" }}>
          <ChemicalText value={text(lang, visualization.descriptionZh, visualization.description)} />
        </p>
      </div>
      <MiniChart type={visualization.chartType} t={t} />
    </article>
  )
}
