// @ts-nocheck
import { ChemicalText, FONT_MONO, formatRiskPenalty } from "../../shared"
import { CONTRIBUTION_COLORS, formatNumber, metricLabel, text } from "./gasViewUtils"
import { dataTypeLabel, evidenceLabel } from "./gasEvidence"

const ORDER = ["uptake", "selectivity", "workingCapacity", "regenerability", "stability", "evidence"]

export function GasScoreBreakdown({ record, lang, t, compact = false }) {
  const contributions = record?.scoreBreakdown?.contributions || {}
  const riskPenalty = Number(record?.scoreBreakdown?.riskPenalty || 0)
  const max = Math.max(12, ...ORDER.map(key => Number(contributions[key] || 0)))

  if (!record) {
    return (
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, padding: 12 }}>
        {text(lang, "暂无分数拆解。", "No score breakdown available.")}
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
      {ORDER.map(key => {
        const value = Number(contributions[key] || 0)
        return (
          <div key={key} style={{ display: "grid", gridTemplateColumns: compact ? "104px minmax(0, 1fr) 42px" : "148px minmax(0, 1fr) 52px", gap: 8, alignItems: "center" }}>
            <span style={{ color: t.muted, fontSize: compact ? 10.5 : 11.5, overflowWrap: "anywhere" }}>{metricLabel(key, lang)}</span>
            <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: compact ? 7 : 9, overflow: "hidden" }}>
              <span style={{ background: CONTRIBUTION_COLORS[key], display: "block", height: "100%", width: `${Math.max(3, (value / max) * 100)}%` }} />
            </span>
            <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: compact ? 10.5 : 11.5, fontWeight: 850, textAlign: "right" }}>{formatNumber(value)}</span>
          </div>
        )
      })}
      <div style={{ alignItems: "center", display: "grid", gridTemplateColumns: compact ? "104px minmax(0, 1fr) 42px" : "148px minmax(0, 1fr) 52px", gap: 8 }}>
        <span style={{ color: t.warn, fontSize: compact ? 10.5 : 11.5 }}>{text(lang, "风险扣分", "Risk penalty")}</span>
        <span style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 999, height: compact ? 7 : 9, overflow: "hidden" }}>
          <span style={{ background: CONTRIBUTION_COLORS.riskPenalty, display: "block", height: "100%", width: `${Math.min(100, riskPenalty * 6)}%` }} />
        </span>
        <span style={{ color: t.warn, fontFamily: FONT_MONO, fontSize: compact ? 10.5 : 11.5, fontWeight: 850, textAlign: "right" }}>{formatRiskPenalty(riskPenalty, lang).replace(/^风险惩罚：/, "")}</span>
      </div>
      {!compact ? (
        <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45 }}>
          <ChemicalText value={dataTypeLabel(record.dataType, lang)} /> · <ChemicalText value={evidenceLabel(record.evidenceLevel, lang)} />
        </div>
      ) : null}
    </div>
  )
}
