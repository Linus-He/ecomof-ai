// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, StatusPill, text } from "./FinalScreeningShared"
import { roleColor } from "./HotSpotMapLegend"

const plot = { left: 66, top: 30, width: 516, height: 300 }
const px = value => plot.left + Math.max(0, Math.min(1, Number(value) || 0)) * plot.width
const py = value => plot.top + (1 - Math.max(0, Math.min(1, Number(value) || 0))) * plot.height

function roleTone(role) {
  if (role === "primary hypothesis") return "pass"
  if (role === "backup hypothesis") return "info"
  return "warn"
}

// Radius encodes the synergy score (OACS x DMRS): larger marker = higher score.
function radiusForScore(score) {
  const value = Math.max(0, Math.min(1, Number(score) || 0))
  return 6 + value * 9
}

// Points share the same framework robustness (single selected scaffold), so they
// would stack vertically. We apply a small symmetric horizontal display offset
// (jitter) per overlapping point to keep markers legible. The offset is visual only.
function withJitter(data = []) {
  const groups = new Map()
  data.forEach(point => {
    const key = `${Math.round(px(point.x))}-${Math.round(py(point.y) / 14)}`
    const bucket = groups.get(key) || []
    bucket.push(point)
    groups.set(key, bucket)
  })
  const offsets = new Map()
  groups.forEach(bucket => {
    const span = bucket.length - 1
    bucket.forEach((point, index) => {
      offsets.set(point.label, span ? (index - span / 2) * 22 : 0)
    })
  })
  return data.map(point => ({ ...point, jitterX: offsets.get(point.label) || 0 }))
}

const QUADRANTS = [
  { id: "priority", en: "Priority validation", zh: "优先验证区", descEn: "High framework robustness + high active-site value: validate first.", descZh: "高骨架稳健性 + 高活性位点价值：优先验证。" },
  { id: "conservative", en: "Structurally conservative", zh: "结构保守区", descEn: "High framework robustness + low active-site value: structurally safe but less active.", descZh: "高骨架稳健性 + 低活性位点价值：结构保守。" },
  { id: "risk", en: "Risk candidate", zh: "风险候选区", descEn: "Low framework robustness + high active-site value: active but structurally risky.", descZh: "低骨架稳健性 + 高活性位点价值：风险候选。" },
  { id: "low", en: "Low priority", zh: "低优先级区", descEn: "Low framework robustness + low active-site value: low priority.", descZh: "低骨架稳健性 + 低活性位点价值：低优先级。" },
]

const LEGEND_ROLES = [
  ["primary hypothesis", "Primary hypothesis", "主要假设"],
  ["backup hypothesis", "Backup hypothesis", "备选假设"],
  ["competitive metal", "Competitive candidate", "竞争候选"],
]

export function SynergyHotSpotMap({ data = [], region = {}, lang, t }) {
  const points = useMemo(() => withJitter(data), [data])
  const [active, setActive] = useState(() => points.find(point => point.metal === "Mo") || points[0])
  const midX = px(0.5)
  const midY = py(0.5)

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 13.4 }}>
        {text(lang, "OACS–DMRS 候选优先级地图", "OACS–DMRS Candidate Priority Map")}
      </strong>
      <div style={{ borderRadius: 10, minWidth: 0, overflow: "hidden", position: "relative" }}>
        <svg viewBox="0 0 600 384" role="img" aria-label="OACS-DMRS Candidate Priority Map" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "block", height: "auto", maxWidth: "100%", width: "100%" }}>
          <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill={t.surface} stroke={t.border} rx="8" />
          {/* Quadrant tint: priority validation (top-right) is highlighted. */}
          <rect x={midX} y={plot.top} width={plot.left + plot.width - midX} height={midY - plot.top} fill={t.badgeGoodBg || t.badgeInfoBg} opacity="0.5" />
          <line x1={midX} x2={midX} y1={plot.top} y2={plot.top + plot.height} stroke={t.border} strokeDasharray="2 4" />
          <line x1={plot.left} x2={plot.left + plot.width} y1={midY} y2={midY} stroke={t.border} strokeDasharray="2 4" />
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              <text x={px(tick)} y={plot.top + plot.height + 20} fill={t.faint} fontSize="10.5" textAnchor="middle">{tick.toFixed(2)}</text>
              <text x={plot.left - 10} y={py(tick) + 4} fill={t.faint} fontSize="10.5" textAnchor="end">{tick.toFixed(2)}</text>
            </g>
          ))}
          {/* Quadrant corner labels */}
          <text x={plot.left + plot.width - 8} y={plot.top + 16} fill={t.accentText} fontSize="10.5" fontWeight="900" textAnchor="end">{text(lang, "优先验证区", "Priority validation")}</text>
          <text x={plot.left + plot.width - 8} y={plot.top + plot.height - 8} fill={t.faint} fontSize="10.5" fontWeight="800" textAnchor="end">{text(lang, "结构保守区", "Structurally conservative")}</text>
          <text x={plot.left + 8} y={plot.top + 16} fill={t.warn} fontSize="10.5" fontWeight="800" textAnchor="start">{text(lang, "风险候选区", "Risk candidate")}</text>
          <text x={plot.left + 8} y={plot.top + plot.height - 8} fill={t.faint} fontSize="10.5" fontWeight="800" textAnchor="start">{text(lang, "低优先级区", "Low priority")}</text>
          {/* Axis titles */}
          <text x={plot.left + plot.width / 2} y={372} fill={t.muted} fontSize="11.5" fontWeight="800" textAnchor="middle">
            {text(lang, "骨架稳健性", "Framework robustness")}
          </text>
          <text x="16" y={plot.top + plot.height / 2} fill={t.muted} fontSize="11.5" fontWeight="800" textAnchor="middle" transform={`rotate(-90 16 ${plot.top + plot.height / 2})`}>
            {text(lang, "金属活性位点价值", "Metal active-site value")}
          </text>
          {points.map(point => {
            const color = roleColor(point.role, null, t)
            const radius = radiusForScore(point.synergyScore)
            const cx = px(point.x) + (point.jitterX || 0)
            const cy = py(point.y)
            const isActive = active?.label === point.label
            return (
              <g key={point.label} onMouseEnter={() => setActive(point)} onFocus={() => setActive(point)} tabIndex={0} style={{ cursor: "pointer", outline: "none" }}>
                {/* Native title shows on hover/focus only; it does not occupy the plot. */}
                <title>{`${point.label} · ${text(lang, "协同得分", "synergy")} ${formatScore(point.synergyScore)} · ${point.role}`}</title>
                <circle cx={cx} cy={cy} r={radius} fill={color} stroke={isActive ? t.textStrong : color} strokeWidth={isActive ? 2.6 : 1.2} opacity="0.9" />
                <text x={cx} y={cy - radius - 4} fill={t.textStrong} fontSize="10.5" fontWeight={point.metal === "Mo" ? 900 : 760} textAnchor="middle">
                  {point.metal}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend kept outside the plot area so it never covers data. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {LEGEND_ROLES.map(([role, en, zh]) => (
          <span key={role} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 6, lineHeight: 1.1, padding: "5px 8px" }}>
            <span style={{ background: roleColor(role, null, t), borderRadius: 999, display: "inline-flex", height: 9, width: 9 }} />
            {text(lang, zh, en)}
          </span>
        ))}
        <span style={{ alignItems: "center", color: t.faint, display: "inline-flex", fontSize: 10.5, fontWeight: 800, gap: 5, lineHeight: 1.1, padding: "5px 4px" }}>
          {text(lang, "点大小 = OACS×DMRS 协同得分", "marker size = OACS×DMRS synergy score")}
        </span>
      </div>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}><ChemicalText value={displayValue(active?.label)} /></strong>
          <StatusPill tone={roleTone(active?.role)} t={t}>{active?.role || "pending"}</StatusPill>
        </div>
        <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", lineHeight: 1.45 }}>
          <span>{text(lang, "骨架稳健性", "Framework robustness")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.frameworkRobustness)}</strong></span>
          <span>{text(lang, "金属活性位点价值", "Metal active-site value")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.metalOxoActivity)}</strong></span>
          <span>{text(lang, "协同得分", "Synergy score")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.synergyScore)}</strong></span>
        </div>
        <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.4 }}>
          <ChemicalText value={text(lang, "metadata 核验等级、敏感性风险与验证优先级详见候选详情面板与候选验证路线。", "Metadata verification level, sensitivity risk, and validation priority are shown in the candidate detail panel and the candidate validation roadmap.")} />
        </span>
      </article>

      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {QUADRANTS.map(q => (
          <div key={q.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 3, padding: 9 }}>
            <strong style={{ color: q.id === "priority" ? t.accentText : q.id === "risk" ? t.warn : t.textStrong, fontSize: 11.8 }}>{text(lang, q.zh, q.en)}</strong>
            <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.4 }}>{text(lang, q.descZh, q.descEn)}</span>
          </div>
        ))}
      </div>

      <p style={{ color: t.muted, fontSize: 11.6, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该图仅用于展示当前已加载候选的优先级分布，不代表经完整验证的全量数据库筛选。坐标相近的候选已做显示偏移以避免重叠。",
          "This map visualizes currently loaded candidates only and is not full verified database screening. Markers with near-identical coordinates are offset for readability."
        )} />
      </p>
    </div>
  )
}
