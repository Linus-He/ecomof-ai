// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, StatusPill, text } from "./FinalScreeningShared"
import { roleColor } from "./HotSpotMapLegend"

const plot = { left: 62, top: 30, width: 520, height: 300 }
const px = value => plot.left + Math.max(0, Math.min(1, Number(value) || 0)) * plot.width
const py = value => plot.top + (1 - Math.max(0, Math.min(1, Number(value) || 0))) * plot.height

function pointRole(point) {
  if (point.dataQualityGate === "rejected") return "rejected by hard gate"
  if (point.dataQualityGate === "needs_review") return "needs review"
  if (point.isSelected) return "selected scaffold"
  if (point.dataMode === "curated_real_examples") return "curated real example"
  if (point.evidenceStatus === "mapped_fixture" || point.evidenceLabel === "Mapped fixture") return "mapped fixture"
  if (point.evidenceStatus === "demo_proxy" || point.evidenceLabel === "Demo proxy") return "demo proxy"
  if (point.gateStatus === "fail") return "rejected by hard gate"
  if (point.gateStatus === "needs_review") return "needs review"
  return "competitive metal"
}

function pointTitle(point) {
  return [
    point.name,
    `Data mode: ${point.dataModeLabel || point.evidenceLabel || "Demo proxy"}`,
    `Source: ${point.sourceDatabase || "Pending provenance"}`,
    `Record ID: ${point.sourceRecordId || "pending"}`,
    `DOI: ${point.doiStatus || (point.sourceDoi ? "DOI verified" : "DOI pending")}`,
    `Quality gate: ${point.dataQualityGateLabel || point.dataQualityGate || point.gateStatus || "pending"}`,
    `Hydrothermal: ${point.hydrothermalEvidenceStatus || point.gateStatus || "pending"}`,
    `Can enter scoring: ${point.canEnterScoring ? "yes" : point.dataMode === "curated_real_examples" ? "no" : "demo/proxy"}`,
    `OACS: ${displayValue(point.oacs)}`,
  ].join(" · ")
}

export function ScaffoldHotSpotMap({ data = [], selectedScaffold, lang, t }) {
  const selected = selectedScaffold || data.find(point => point.isSelected) || data[0]
  const [active, setActive] = useState(selected)
  const points = data || []

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <svg viewBox="0 0 640 390" role="img" aria-label="Scaffold Hot Spot Map" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, height: "auto", maxWidth: "100%", width: "100%" }}>
        <defs>
          <linearGradient id="scaffoldHotSpotBg" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor={t.surface} />
            <stop offset="100%" stopColor={t.badgeInfoBg} />
          </linearGradient>
        </defs>
        <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill="url(#scaffoldHotSpotBg)" rx="10" />
        <rect x={px(0.65)} y={plot.top} width={px(1) - px(0.65)} height={py(0.65) - plot.top} fill={t.badgeGoodBg || t.badgeInfoBg} opacity="0.5" rx="8" />
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <g key={tick}>
            <line x1={px(tick)} x2={px(tick)} y1={plot.top} y2={plot.top + plot.height} stroke={t.border} strokeDasharray="3 5" />
            <line x1={plot.left} x2={plot.left + plot.width} y1={py(tick)} y2={py(tick)} stroke={t.border} strokeDasharray="3 5" />
            <text x={px(tick)} y={plot.top + plot.height + 22} fill={t.faint} fontSize="11" textAnchor="middle">{tick.toFixed(2)}</text>
            <text x={plot.left - 12} y={py(tick) + 4} fill={t.faint} fontSize="11" textAnchor="end">{tick.toFixed(2)}</text>
          </g>
        ))}
        <text x={plot.left + plot.width / 2} y={374} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle">
          {text(lang, "水热稳定性证据强度", "Hydrothermal Evidence Strength")}
        </text>
        <text x="18" y={plot.top + plot.height / 2} fill={t.muted} fontSize="12" fontWeight="800" textAnchor="middle" transform={`rotate(-90 18 ${plot.top + plot.height / 2})`}>
          {text(lang, "C1 中间体可及性", "C1 Intermediate Accessibility")}
        </text>
        <text x={px(0.66)} y={plot.top + 18} fill={t.accentText} fontSize="11" fontWeight="900">
          {text(lang, "OACS 热区", "OACS hot region")}
        </text>
        {points.map(point => {
          const role = pointRole(point)
          const radius = point.isSelected ? 8 : 5 + Math.max(0, point.colorValue || 0) * 4
          return (
            <g key={point.id} onMouseEnter={() => setActive(point)} onFocus={() => setActive(point)} tabIndex={0} style={{ cursor: "pointer", outline: "none" }}>
              <title>{pointTitle(point)}</title>
              <circle
                cx={px(point.x)}
                cy={py(point.y)}
                r={radius}
                fill={role === "rejected by hard gate" ? "none" : roleColor(role, point.gateStatus, t)}
                stroke={point.isSelected ? t.textStrong : roleColor(role, point.gateStatus, t)}
                strokeWidth={point.isSelected ? 3 : role === "rejected by hard gate" ? 2 : 1}
                opacity={role === "needs review" ? 0.65 : 0.92}
              />
              {point.isSelected ? (
                <text x={px(point.x) + 11} y={py(point.y) - 9} fill={t.textStrong} fontSize="11" fontWeight="900">
                  {text(lang, "选定骨架", "selected scaffold")}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}><ChemicalText value={active?.name || selected?.name || "Pending scaffold"} /></strong>
          <StatusPill tone={active?.gateStatus === "pass" ? "pass" : active?.gateStatus === "fail" ? "fail" : "warn"} t={t}>{active?.gateStatus || "pending"}</StatusPill>
        </div>
        <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", lineHeight: 1.45 }}>
          <span>OACS: <strong style={{ color: t.textStrong }}>{formatScore(active?.oacs)}</strong></span>
          <span>{text(lang, "坍塌风险", "Collapse risk")}: <strong style={{ color: t.textStrong }}>{formatScore(active?.collapseRisk)}</strong></span>
          <span>{text(lang, "证据状态", "Evidence status")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.evidenceLabel || active?.evidenceStatus)}</strong></span>
          <span>{text(lang, "数据模式", "Data mode")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.dataModeLabel || active?.evidenceLabel)}</strong></span>
          <span>{text(lang, "来源数据库", "Source database")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.sourceDatabase || "Pending provenance")}</strong></span>
          <span>{text(lang, "来源记录", "Source record")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.sourceRecordId || "pending")}</strong></span>
          <span>{text(lang, "DOI 状态", "DOI status")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.doiStatus || (active?.sourceDoi ? "DOI verified" : "DOI pending"))}</strong></span>
          <span>{text(lang, "质量门", "Quality gate")}: <strong style={{ color: t.textStrong }}>{displayValue(active?.dataQualityGateLabel || active?.dataQualityGate || active?.gateStatus)}</strong></span>
          <span>{text(lang, "可评分", "Can enter scoring")}: <strong style={{ color: t.textStrong }}>{active?.canEnterScoring ? text(lang, "是", "yes") : active?.dataMode === "curated_real_examples" ? text(lang, "否", "no") : "demo/proxy"}</strong></span>
        </div>
        <p style={{ color: active?.gateStatus === "fail" ? t.warn : t.muted, fontSize: 12.2, fontWeight: active?.gateStatus === "fail" ? 900 : 700, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={text(lang, active?.whyZh, active?.why)} />
        </p>
      </article>
    </div>
  )
}
