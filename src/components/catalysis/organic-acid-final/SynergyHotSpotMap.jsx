// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { CatalysisCatProbe } from "../CatalysisCatProbe"
import { displayValue, formatScore, StatusPill, text } from "./FinalScreeningShared"
import { roleColor } from "./HotSpotMapLegend"

const plot = { left: 62, top: 30, width: 520, height: 300 }
const px = value => plot.left + Math.max(0, Math.min(1, Number(value) || 0)) * plot.width
const py = value => plot.top + (1 - Math.max(0, Math.min(1, Number(value) || 0))) * plot.height

function roleTone(role) {
  if (role === "primary hypothesis") return "pass"
  if (role === "backup hypothesis") return "info"
  return "warn"
}

export function SynergyHotSpotMap({ data = [], region = {}, lang, t }) {
  const [active, setActive] = useState(data.find(point => point.metal === "Mo") || data[0])
  const xMin = region.xMin ?? 0.65
  const yMin = region.yMin ?? 0.65

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <CatalysisCatProbe boundaryId="hotspot-synergy" chartMode="synergy" lang={lang} t={t}>
        <svg viewBox="0 0 640 390" role="img" aria-label="Synergy Hot Spot Map" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "block", height: "auto", maxWidth: "100%", width: "100%" }}>
          <defs>
            <linearGradient id="synergyHotSpotBg" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor={t.surface} />
              <stop offset="100%" stopColor={t.badgeInfoBg} />
            </linearGradient>
          </defs>
          <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill="url(#synergyHotSpotBg)" rx="10" />
          <rect x={px(xMin)} y={plot.top} width={px(1) - px(xMin)} height={py(yMin) - plot.top} fill={t.badgeGoodBg || t.badgeInfoBg} opacity="0.55" rx="8" />
          {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <g key={tick}>
              <line x1={px(tick)} x2={px(tick)} y1={plot.top} y2={plot.top + plot.height} stroke={t.border} strokeDasharray="3 5" />
              <line x1={plot.left} x2={plot.left + plot.width} y1={py(tick)} y2={py(tick)} stroke={t.border} strokeDasharray="3 5" />
              <text x={px(tick)} y={plot.top + plot.height + 22} fill={t.faint} fontSize="11" textAnchor="middle">{tick.toFixed(2)}</text>
              <text x={plot.left - 12} y={py(tick) + 4} fill={t.faint} fontSize="11" textAnchor="end">{tick.toFixed(2)}</text>
            </g>
          ))}
          <text x={plot.left + plot.width / 2} y={374} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle">
            {text(lang, "骨架稳健性", "Framework Robustness")}
          </text>
          <text x="18" y={plot.top + plot.height / 2} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle" transform={`rotate(-90 18 ${plot.top + plot.height / 2})`}>
            {text(lang, "金属氧活性位点价值", "Metal-Oxo Activity")}
          </text>
          <text x={px(xMin) + 8} y={plot.top + 18} fill={t.accentText} fontSize="11" fontWeight="900">
            {text(lang, "OACS × DMRS 协同热区", "OACS × DMRS synergy hot spot")}
          </text>
          {data.map(point => {
            const color = roleColor(point.role, null, t)
            const radius = point.metal === "Mo" ? 12 : point.metal === "W" ? 10 : 7
            return (
              <g key={point.label} onMouseEnter={() => setActive(point)} onFocus={() => setActive(point)} tabIndex={0} style={{ cursor: "pointer", outline: "none" }}>
                <title>{`${point.label} · synergy ${point.synergyScore} · ${point.role}`}</title>
                <circle cx={px(point.x)} cy={py(point.y)} r={radius} fill={color} stroke={point.metal === "Mo" || point.metal === "W" ? t.textStrong : color} strokeWidth={point.metal === "Mo" ? 3 : point.metal === "W" ? 2.4 : 1.5} opacity="0.92" />
                <text x={px(point.x) + 12} y={py(point.y) + (point.metal === "Mo" ? -8 : 5)} fill={t.textStrong} fontSize="11" fontWeight={point.metal === "Mo" || point.metal === "W" ? 900 : 760}>
                  {point.label}
                </text>
              </g>
            )
          })}
        </svg>
      </CatalysisCatProbe>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}><ChemicalText value={displayValue(active?.label)} /></strong>
          <StatusPill tone={roleTone(active?.role)} t={t}>{active?.role || "pending"}</StatusPill>
        </div>
        <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", lineHeight: 1.45 }}>
          <span>{text(lang, "骨架稳健性", "Framework robustness")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.frameworkRobustness)}</strong></span>
          <span>{text(lang, "金属氧活性", "Metal-oxo activity")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.metalOxoActivity)}</strong></span>
          <span>{text(lang, "协同得分", "Synergy score")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.synergyScore)}</strong></span>
        </div>
        <p style={{ color: t.accentText, fontSize: 12.2, fontWeight: 900, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={text(
            lang,
            "高亮区域表示当前演示级代理设计热区：骨架稳健性与金属氧活性位点价值同时较优。",
            "The highlighted region represents the current demo/proxy design hot spot where scaffold robustness and metal-oxo active-site value are simultaneously favorable."
          )} />
        </p>
      </article>
    </div>
  )
}
