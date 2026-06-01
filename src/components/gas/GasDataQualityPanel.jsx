// @ts-nocheck
import { BasisBadge, SectionTitle } from "../../shared"
import { buildGasQualityChecklist, dataCompletenessScore, recommendedCurationAction } from "./gasEvidence"
import { text } from "./gasViewUtils"

function markFor(item, lang) {
  if (item.severity === "pass") return "✓"
  if (item.severity === "warn") return "△"
  return "✕"
}

function colorFor(item, t) {
  if (item.severity === "pass") return t.success || t.accentText
  if (item.severity === "warn") return t.warn
  return t.subtle
}

export function GasDataQualityPanel({ record, lang = "en", t }) {
  if (!record) return null
  const checklist = buildGasQualityChecklist(record, lang)
  const completeness = dataCompletenessScore(record)
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 16 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "Gas Data Quality Panel", "Gas Data Quality Panel")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>
            {text(lang, "检查工况、单位、来源、描述符溯源和验证缺口。", "Checks condition, units, source, descriptor provenance, and validation gaps.")}
          </div>
        </div>
        <BasisBadge tone="info">{text(lang, "完整度", "Completeness")}: {completeness.label}</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {checklist.map(item => (
          <div key={item.label} style={{ alignItems: "start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", gap: 7, gridTemplateColumns: "22px minmax(0, 1fr)", minHeight: 44, padding: 9 }}>
            <span aria-hidden="true" style={{ color: colorFor(item, t), fontWeight: 950 }}>{markFor(item, lang)}</span>
            <span style={{ fontSize: 11.8, lineHeight: 1.35 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", gap: 5, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
        <div>{text(lang, "证据等级", "Evidence level")}: <strong style={{ color: t.textStrong }}>{record.evidenceLevel || "D"}</strong></div>
        <div>{text(lang, "建议整理动作", "Recommended curation action")}: <strong style={{ color: t.textStrong }}>{recommendedCurationAction(record, lang)}</strong></div>
      </div>
    </section>
  )
}
