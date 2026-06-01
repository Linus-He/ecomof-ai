// @ts-nocheck
import { BasisBadge, ChemicalText, SectionTitle, formatGasPairLabel } from "../../shared"
import { text, validationForRecord } from "./gasViewUtils"
import { dataTypeLabel } from "./gasEvidence"

function priorityTone(priority = "") {
  const label = String(priority).toLowerCase()
  if (label.includes("high")) return "warn"
  if (label.includes("medium")) return "info"
  return "proxy"
}

function localizedValue(recommendation, key, lang) {
  const zhKey = `${key}Zh`
  return lang === "zh" && recommendation?.[zhKey] ? recommendation[zhKey] : recommendation?.[key]
}

function localizedList(recommendation, key, lang) {
  const zhKey = `${key}Zh`
  const value = lang === "zh" && Array.isArray(recommendation?.[zhKey]) ? recommendation[zhKey] : recommendation?.[key]
  return Array.isArray(value) ? value.join(", ") : value
}

export function GasValidationRecommendation({ record, scenario, lang, t }) {
  if (!record) {
    return (
      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{text(lang, "Validation Recommendation", "Validation Recommendation")}</SectionTitle>
        <div style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>{text(lang, "未选中候选。", "No candidate selected.")}</div>
      </section>
    )
  }
  const recommendation = validationForRecord(record, scenario, lang)
  const rows = [
    [text(lang, "Recommended next validation", "Recommended next validation"), localizedValue(recommendation, "type", lang)],
    [text(lang, "Why this validation", "Why this validation"), localizedValue(recommendation, "reason", lang)],
    [text(lang, "Required data", "Required data"), localizedList(recommendation, "requiredData", lang)],
    [text(lang, "Expected output", "Expected output"), localizedValue(recommendation, "expectedOutput", lang)],
    [text(lang, "Evidence impact", "Evidence impact"), localizedValue(recommendation, "evidenceImpact", lang)],
  ]
  const recommendationType = localizedValue(recommendation, "type", lang) || recommendation.type
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "Validation Recommendation", "Validation Recommendation")}</SectionTitle>
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, marginTop: 6 }}><ChemicalText value={record.displayName} /></div>
        </div>
        <BasisBadge tone={priorityTone(recommendation.priority)}>{recommendation.priority || "medium"}</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "170px minmax(0, 1fr)", gap: 10, borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5, overflowWrap: "anywhere" }}><ChemicalText value={value || "pending"} /></div>
          </div>
        ))}
      </div>
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 12, lineHeight: 1.58, marginTop: 12, padding: 10 }}>
        {text(
          lang,
          `建议下一步进行 ${recommendationType}，因为当前候选仍包含 ${dataTypeLabel(record.dataType, lang)} 证据边界。该验证可提高证据等级，并确认其在 ${formatGasPairLabel(scenario.gasPair || record.gasPair)} 混合气条件下是否仍保持优势。`,
          `Next step: ${recommendation.type}. The current record still carries a ${dataTypeLabel(record.dataType, lang)} evidence boundary. This validation can improve evidence confidence and test whether the advantage holds under ${formatGasPairLabel(scenario.gasPair || record.gasPair)} mixture conditions.`
        )}
      </div>
    </section>
  )
}
