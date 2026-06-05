// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, StatusPill, text } from "./FinalScreeningShared"
import { roleColor } from "./HotSpotMapLegend"

const plot = { left: 62, top: 30, width: 520, height: 300 }
const px = value => plot.left + Math.max(0, Math.min(1, Number(value) || 0)) * plot.width
const py = value => plot.top + (1 - Math.max(0, Math.min(1, Number(value) || 0))) * plot.height

function roleTone(role) {
  if (role === "primary hypothesis") return "pass"
  if (role === "backup hypothesis") return "info"
  if (role === "blind baseline") return "proxy"
  return "warn"
}

export function DopantMetalHotSpotMap({ data = [], lang, t }) {
  const [active, setActive] = useState(data.find(point => point.metal === "Mo") || data[0])

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <svg viewBox="0 0 640 390" role="img" aria-label="Dopant Metal Hot Spot Map" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, height: "auto", maxWidth: "100%", width: "100%" }}>
        <defs>
          <linearGradient id="dopantHotSpotBg" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor={t.surface} />
            <stop offset="100%" stopColor={t.badgeInfoBg} />
          </linearGradient>
        </defs>
        <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill="url(#dopantHotSpotBg)" rx="10" />
        <rect x={px(0.65)} y={plot.top} width={px(1) - px(0.65)} height={py(0.65) - plot.top} fill={t.badgeGoodBg || t.badgeInfoBg} opacity="0.45" rx="8" />
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <g key={tick}>
            <line x1={px(tick)} x2={px(tick)} y1={plot.top} y2={plot.top + plot.height} stroke={t.border} strokeDasharray="3 5" />
            <line x1={plot.left} x2={plot.left + plot.width} y1={py(tick)} y2={py(tick)} stroke={t.border} strokeDasharray="3 5" />
            <text x={px(tick)} y={plot.top + plot.height + 22} fill={t.faint} fontSize="11" textAnchor="middle">{tick.toFixed(2)}</text>
            <text x={plot.left - 12} y={py(tick) + 4} fill={t.faint} fontSize="11" textAnchor="end">{tick.toFixed(2)}</text>
          </g>
        ))}
        <text x={plot.left + plot.width / 2} y={374} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle">
          {text(lang, "缺陷锚定可行性", "Defect Anchoring Feasibility")}
        </text>
        <text x="18" y={plot.top + plot.height / 2} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle" transform={`rotate(-90 18 ${plot.top + plot.height / 2})`}>
          {text(lang, "活性位点价值", "Active-site Value")}
        </text>
        <text x={px(0.66)} y={plot.top + 18} fill={t.accentText} fontSize="11" fontWeight="900">
          {text(lang, "高优先级第二金属热区", "high-priority dopant region")}
        </text>
        {data.map(point => {
          const color = roleColor(point.role, null, t)
          const radius = point.isPrimary ? 11 : point.isBackup ? 9 : point.isBlindBaseline ? 5 : 7
          return (
            <g key={point.metal} onMouseEnter={() => setActive(point)} onFocus={() => setActive(point)} tabIndex={0} style={{ cursor: "pointer", outline: "none" }}>
              <title>{`${point.metal} · DMRS ${point.dmrs} · rank ${point.rank} · ${point.role}`}</title>
              <circle
                cx={px(point.x)}
                cy={py(point.y)}
                r={radius}
                fill={point.isBlindBaseline ? "none" : color}
                stroke={point.isPrimary || point.isBackup ? t.textStrong : color}
                strokeWidth={point.isPrimary ? 3 : point.isBackup ? 2.4 : 1.5}
                opacity={point.isBlindBaseline ? 0.72 : 0.9}
              />
              <text x={px(point.x) + 11} y={py(point.y) + 4} fill={t.textStrong} fontSize="11" fontWeight={point.isPrimary || point.isBackup ? 900 : 760}>
                {point.metal}
              </text>
            </g>
          )
        })}
      </svg>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{displayValue(active?.metal)}</strong>
          <StatusPill tone={roleTone(active?.role)} t={t}>{active?.role || "pending"}</StatusPill>
        </div>
        <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", lineHeight: 1.45 }}>
          <span>DMRS: <strong style={{ color: t.textStrong }}>{formatScore(active?.dmrs)}</strong></span>
          <span>{text(lang, "排名", "Rank")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.rank)}</strong></span>
          <span>{text(lang, "证据状态", "Evidence status")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.evidenceStatus)}</strong></span>
          <span>{text(lang, "主要风险", "Main risk")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.mainRisk)}</strong></span>
        </div>
        <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={displayValue(active?.mostLikelyForm)} />
        </p>
        <p style={{ color: t.accentText, fontSize: 12.2, fontWeight: 900, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={text(lang, "Mo 与 W 位于当前高优先级第二金属热区附近。", "Mo and W lie near the current high-priority dopant region.")} />
        </p>
      </article>
    </div>
  )
}
