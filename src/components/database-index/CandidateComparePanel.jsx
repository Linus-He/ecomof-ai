// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbFallback, dbRenderText, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { formatPercentValue } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildMetadataVerificationSummary, metadataLevelLabel, metadataLevelTone } from "../../utils/databaseIndex/metadataVerification"

const ROWS = [
  ["name", "name", "名称"],
  ["sourceDatabase", "sourceDatabase", "来源数据库"],
  ["sourceRecordId", "sourceRecordId", "来源记录 ID"],
  ["qualityStatus", "qualityStatus", "质量状态"],
  ["descriptorCompleteness", "descriptor completeness", "描述符完整度", "percent"],
  ["provenanceCompleteness", "provenance completeness", "来源完整度", "percent"],
  ["surfaceArea", "surfaceArea", "surfaceArea"],
  ["poreSizeA", "poreSizeA", "poreSizeA"],
  ["poreVolume", "poreVolume", "poreVolume"],
  ["bandGap", "bandGap", "bandGap"],
  ["waterStability", "waterStability", "waterStability"],
  ["organicAcidRelevance", "organic acid relevance", "有机酸相关性"],
]

function renderValue(row, field, mode, lang) {
  if (mode === "percent") return formatPercentValue(row[field])
  return dbRenderText(displayValue(row[field], dbFallback(lang)), lang)
}

export function CandidateComparePanel({ candidates = [], onRemove, lang, t, isMobile }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{dbText(lang, "candidateCompare")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            {text(
              lang,
              `最多同时对比 3 个候选；${dbText(lang, "previewIndexDataOnly")}。`,
              `Compare up to 3 candidates; ${dbText(lang, "previewIndexDataOnly")}.`
            )}
          </span>
        </div>
        <StatusPill tone={candidates.length >= 3 ? "warn" : "proxy"} t={t}>{`${candidates.length} / 3`}</StatusPill>
      </header>
      {candidates.some(candidate => !buildMetadataVerificationSummary(candidate, lang).eligible) ? (
        <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={dbText(lang, "missingKeyMetadata")} />
        </p>
      ) : null}
      {!candidates.length ? (
        <span style={{ color: t.muted, fontSize: 12 }}>
          {text(lang, "从 Top-N 候选或索引分片浏览器加入候选开始对比。", "Add candidates from Top Candidates or Index Part Browser to start comparison.")}
        </span>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: isMobile ? 640 : 720, width: "100%" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.5, padding: "7px 6px", textAlign: "left", textTransform: "uppercase" }}>{text(lang, "字段", "Field")}</th>
                {candidates.map(candidate => (
                  <th key={candidate.id} style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11.8, padding: "7px 6px", textAlign: "left" }}>
                    <div style={{ display: "grid", gap: 5 }}>
                      <ChemicalText value={candidate.name} />
                      <button type="button" onClick={() => onRemove?.(candidate.id)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, cursor: "pointer", fontSize: 11, fontWeight: 850, justifySelf: "start", minHeight: 26, padding: "4px 7px" }}>
                        {text(lang, "移除", "Remove")}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderTop: `1px solid ${t.divider}`, color: t.faint, fontSize: 11, fontWeight: 900, padding: "7px 6px", textTransform: "uppercase" }}>{dbText(lang, "metadataVerification")}</td>
                {candidates.map(candidate => {
                  const summary = buildMetadataVerificationSummary(candidate, lang)
                  return (
                    <td key={`${candidate.id}-metadata`} style={{ borderTop: `1px solid ${t.divider}`, padding: "7px 6px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <StatusPill tone={metadataLevelTone(summary.level)} t={t}>{metadataLevelLabel(summary.level, lang)}</StatusPill>
                        <StatusPill tone={summary.eligible ? "pass" : "warn"} t={t}>{summary.eligible ? dbText(lang, "eligibleForVerifiedRecommendation") : dbText(lang, "previewOnly")}</StatusPill>
                      </div>
                    </td>
                  )
                })}
              </tr>
              {ROWS.map(([field, en, zh, mode]) => (
                <tr key={field}>
                  <td style={{ borderTop: `1px solid ${t.divider}`, color: t.faint, fontSize: 11, fontWeight: 900, padding: "7px 6px", textTransform: "uppercase" }}>{text(lang, zh, en)}</td>
                  {candidates.map(candidate => (
                    <td key={`${candidate.id}-${field}`} style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.6, lineHeight: 1.4, overflowWrap: "anywhere", padding: "7px 6px", verticalAlign: "top" }}>
                      <ChemicalText value={renderValue(candidate, field, mode, lang)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
