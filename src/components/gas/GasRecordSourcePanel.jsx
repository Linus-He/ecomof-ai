// @ts-nocheck
import { BasisBadge, ChemicalText, SectionTitle, formatPercent } from "../../shared"
import { text } from "./gasViewUtils"
import { GasDataStatusBadge } from "./GasDataStatusBadge"
import { dataTypeLabel, evidenceLabel } from "./gasEvidence"

function boolLabel(value, lang) {
  return value ? text(lang, "是", "yes") : text(lang, "否", "no")
}

export function GasRecordSourcePanel({ record, lang = "en", t }) {
  if (!record) return null
  const provenance = record.recordProvenance || {}
  const rows = [
    ["sourceDatabase", provenance.sourceDatabase],
    ["sourceRecordId", provenance.sourceRecordId],
    ["citation", provenance.citation],
    ["doi", provenance.doi || "pending"],
    ["sourceUrl", provenance.sourceUrl || "pending"],
    ["license", provenance.license],
    ["retrievedAt", provenance.retrievedAt],
    ["curationStatus", record.curationStatus],
    ["dataType", dataTypeLabel(record.dataType, lang)],
    ["evidenceLevel", evidenceLabel(record.evidenceLevel, lang)],
    ["confidence", record.confidence == null ? "pending" : formatPercent(record.confidence, { lang, normalized: true })],
    ["sameConditionEvidence", boolLabel(record.sameConditionEvidence, lang)],
    ["hasIASTValidation", boolLabel(record.hasIASTValidation, lang)],
    ["hasBreakthroughValidation", boolLabel(record.hasBreakthroughValidation, lang)],
  ]
  const labels = {
    sourceDatabase: text(lang, "来源数据库", "Source database"),
    sourceRecordId: text(lang, "来源记录 ID", "Source record id"),
    citation: text(lang, "引用", "Citation"),
    doi: "DOI",
    sourceUrl: "URL",
    license: text(lang, "许可", "License"),
    retrievedAt: text(lang, "检索时间", "Retrieved at"),
    curationStatus: text(lang, "整理状态", "Curation status"),
    dataType: text(lang, "数据类型", "Data type"),
    evidenceLevel: text(lang, "证据等级", "Evidence level"),
    confidence: text(lang, "置信度", "Confidence"),
    sameConditionEvidence: text(lang, "同工况证据", "Same-condition evidence"),
    hasIASTValidation: text(lang, "IAST 验证", "IAST validation"),
    hasBreakthroughValidation: text(lang, "穿透验证", "Breakthrough validation"),
  }
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 16 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "记录来源与证据", "Record Source & Evidence")}</SectionTitle>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, marginTop: 6 }}><ChemicalText value={record.displayName} /></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <GasDataStatusBadge type="dataType" value={record.dataType} lang={lang} />
          <GasDataStatusBadge type="evidence" value={record.evidenceLevel} lang={lang} compact />
          <BasisBadge tone="proxy">{record.curationStatus || "pending"}</BasisBadge>
        </div>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(([key, value]) => (
          <div key={key} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, gridTemplateColumns: "160px minmax(0, 1fr)", paddingTop: 7 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{labels[key]}</span>
            {key === "sourceUrl" && provenance.sourceUrl ? (
              <a href={provenance.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={text(lang, "在新标签页打开记录来源", "Open record source in a new tab")} style={{ color: t.accentText, fontSize: 11.8, overflowWrap: "anywhere" }}>
                <ChemicalText value={value} />
              </a>
            ) : (
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, overflowWrap: "anywhere" }}><ChemicalText value={value || "pending"} /></span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
