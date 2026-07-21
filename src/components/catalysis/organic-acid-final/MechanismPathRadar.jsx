// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatScore, Panel, StatusPill, text } from "./FinalScreeningShared"

const AXES = [
  ["nodeSubstitution", "Node Substitution", "节点取代"],
  ["defectAnchoring", "Defect Anchoring", "缺陷锚定"],
  ["poreConfinement", "Pore Confinement", "孔道限域"],
  ["activeSiteValue", "Active-site Value", "活性位价值"],
  ["aqueousStability", "Aqueous Stability", "水相稳定"],
  ["riskControl", "Risk Control", "风险控制"],
]

const COLORS = {
  Mo: "#1A6DB5",
  W: "#0F8A5F",
  V: "#8A5A12",
  Fe: "#A44343",
  Ti: "#5B6C8C",
  Zr: "#7A5FA8",
}

function pointFor(index, value, size) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.36 * Number(value || 0)
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / AXES.length
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
}

function axisPoint(index, size, scale = 1) {
  return pointFor(index, scale, size)
}

export function MechanismPathRadar({ data, lang, t, isMobile }) {
  const rows = data || []
  const size = isMobile ? 300 : 420
  return (
    <Panel
      id="organic-acid-final-mechanism-radar"
      eyebrow={text(lang, "机制画像", "Mechanism profile")}
      title={text(lang, "机制路径雷达图", "Mechanism Path Radar")}
      t={t}
      actions={<StatusPill tone="info" t={t}>Mo / W / V / Fe / Ti / Zr</StatusPill>}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "雷达图展示不同金属在节点取代、缺陷锚定、孔道限域、活性位价值、水相稳定和风险控制上的机制画像；Mo 不被假设为直接替代 Al3+ 节点。",
          "The radar compares metals across node substitution, defect anchoring, pore confinement, active-site value, aqueous stability, and risk control; Mo is not assumed to directly replace Al3+ nodes."
        )} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 360px", alignItems: "center" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <svg viewBox={`0 0 ${size} ${size}`} style={{ display: "block", maxWidth: "100%", minWidth: isMobile ? 300 : 420 }}>
            {[0.25, 0.5, 0.75, 1].map(scale => (
              <polygon
                key={scale}
                points={AXES.map((_, index) => axisPoint(index, size, scale).join(",")).join(" ")}
                fill="none"
                stroke={t.border}
                strokeWidth="1"
              />
            ))}
            {AXES.map((axis, index) => {
              const [x, y] = axisPoint(index, size, 1)
              const [lx, ly] = axisPoint(index, size, 1.13)
              return (
                <g key={axis[0]}>
                  <line x1={size / 2} y1={size / 2} x2={x} y2={y} stroke={t.borderStrong || t.border} strokeWidth="1" />
                  <text x={lx} y={ly} fill={t.muted} fontSize="11" fontWeight="800" textAnchor={lx < size / 2 - 10 ? "end" : lx > size / 2 + 10 ? "start" : "middle"}>
                    {lang === "zh" ? axis[2] : axis[1]}
                  </text>
                </g>
              )
            })}
            {rows.map(row => {
              const points = AXES.map(([key], index) => pointFor(index, row[key], size))
              const color = COLORS[row.metal] || t.accent
              return (
                <g key={row.metal}>
                  <polygon points={points.map(point => point.join(",")).join(" ")} fill={color} fillOpacity={row.metal === "Mo" ? 0.18 : 0.08} stroke={color} strokeWidth={row.metal === "Mo" ? 2.6 : 1.6} />
                  {points.map(([x, y], index) => <circle key={`${row.metal}-${index}`} cx={x} cy={y} r={row.metal === "Mo" ? 3.5 : 2.5} fill={color} />)}
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {rows.map(row => (
            <article key={row.metal} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: COLORS[row.metal] || t.textStrong, fontSize: 13 }}>{row.metal}</strong>
                <span style={{ color: t.muted, fontSize: 11.5 }}>DMRS {formatScore(row.dmrs)}</span>
              </div>
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.42 }}>
                <ChemicalText value={{
                  Mo: text(lang, "节点取代低；缺陷锚定高；孔道限域中高。", "Node substitution low; defect anchoring high; pore confinement medium-high."),
                  W: text(lang, "Oxo-metal 稳定性高，水热 persistence 强，redox / formate affinity 略弱于 Mo。", "Oxo-metal stability and hydrothermal persistence are strong; redox / formate affinity is slightly weaker than Mo."),
                  V: text(lang, "Redox 高，但浸出 / 价态不稳定风险高。", "Redox is high, but leaching / valence instability risk is higher."),
                  Ti: text(lang, "水相稳定高，redox adaptability 较弱。", "Aqueous stability is high while redox adaptability is weaker."),
                  Zr: text(lang, "骨架稳定性强，active-site value 较低。", "Framework stability is strong while active-site value is lower."),
                  Fe: text(lang, "低成本且 redox active，但副反应 / 浸出风险较高。", "Low cost and redox active, but side-reaction / leaching risk is higher."),
                }[row.metal] || ""}
                />
              </span>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  )
}
