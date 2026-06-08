// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, formatScore, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbRenderText, dbStatusLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { buildCandidateExplanation, formatPercentValue, matchesDatabaseIndexFilters, normalizeTopCandidates, qualityTone } from "../../utils/databaseIndex/databaseIndexFormatters"

function ExplanationPanel({ row, lang, t }) {
  const explanation = buildCandidateExplanation(row)
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.6 }}>{dbText(lang, "whyInPreview")}</strong>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))" }}>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>Rank:</b> #{displayValue(explanation.rank)}</span>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>preview score:</b> {formatScore(explanation.previewScore)}</span>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>descriptor:</b> {formatPercentValue(explanation.descriptorCompleteness)}</span>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>provenance:</b> {formatPercentValue(explanation.provenanceCompleteness)}</span>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "主要正向因素", "Main positive factors")}</span>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={lang === "zh" ? "预览分数、质量门、金属节点和按需详情可用性共同支持进入预览。" : (explanation.positiveFactors.length ? explanation.positiveFactors.join("; ") : "preview score only")} /></span>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "主要缺失字段", "Main missing fields")}</span>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={explanation.missingFields.length ? explanation.missingFields.join(", ") : text(lang, "已加载预览记录中未发现缺失项", "none in loaded preview record")} /></span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Descriptor availability", "Descriptor availability")}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {explanation.descriptorAvailability.map(descriptor => (
            <StatusPill key={descriptor.id} tone={descriptor.available ? "pass" : "warn"} t={t}>{`${descriptor.label}: ${descriptor.available ? text(lang, "可用", "available") : dbText(lang, "evidencePending")}`}</StatusPill>
          ))}
        </div>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6 }}>
        <StatusPill tone={qualityTone(explanation.qualityStatus)} t={t}>{dbStatusLabel(explanation.qualityStatus, lang)}</StatusPill>
        <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
      </div>
      <p style={{ color: t.warn, fontSize: 12, fontWeight: 900, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "这是预计算索引预览，不是最终验证推荐。",
          "This is a precomputed index preview, not a final verified recommendation."
        )} />
      </p>
    </section>
  )
}

export function PrecomputedTopCandidatesPanel({ topCandidates = {}, filters = {}, onOpenDetail, onAddCompare, compareCount = 0, lang, t }) {
  const [expandedId, setExpandedId] = useState("")
  const rows = useMemo(() => normalizeTopCandidates(topCandidates).filter(row => matchesDatabaseIndexFilters(row, filters)), [topCandidates, filters])
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "预计算 Top-N 候选", "Precomputed Top Candidates")}</strong>
          <span style={{ color: t.muted, fontSize: 11.8 }}>{text(lang, `筛选范围：${dbText(lang, "topNPreviewOnly")}`, `Filter scope: ${dbText(lang, "topNPreviewOnly")}`)}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusPill tone="proxy" t={t}>{text(lang, `显示 ${rows.length} 个`, `${rows.length} shown`)}</StatusPill>
          <StatusPill tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusPill>
        </div>
      </header>
      <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, "Top candidates 为预览候选，不是最终验证推荐。", "Top candidates are preview candidates, not final verified recommendations.")} />
      </p>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(row => (
          <article key={row.frameworkId} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, paddingTop: 8 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ alignItems: "start", display: "grid", gap: 7, gridTemplateColumns: "44px minmax(0, 1fr)" }}>
                <strong style={{ color: t.accentText, fontSize: 12 }}>#{row.rank}</strong>
                <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}><ChemicalText value={row.displayName} /></strong>
                  <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.4 }}><ChemicalText value={`${row.frameworkId} · ${displayValue(row.sourceDatabase)} · ${dbStatusLabel(row.dataQualityStatus, lang)} · ${dbRenderText(row.evidenceBoundary, lang)}`} /></span>
                </div>
              </div>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
                <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{formatScore(row.oacsPreview)}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setExpandedId(expandedId === row.frameworkId ? "" : row.frameworkId)} style={{ background: expandedId === row.frameworkId ? t.badgeInfoBg : t.surface, border: `1px solid ${expandedId === row.frameworkId ? t.accentText : t.border}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                    {dbText(lang, "whyInPreview")}
                  </button>
                  <button type="button" onClick={() => onAddCompare?.(row)} disabled={compareCount >= 3} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: compareCount >= 3 ? t.faint : t.accentText, cursor: compareCount >= 3 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                    {text(lang, "对比", "Compare")}
                  </button>
                  <button type="button" onClick={() => onOpenDetail?.(row)} disabled={!row.detailRef} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: row.detailRef ? t.accentText : t.faint, cursor: row.detailRef ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                    {text(lang, "详情", "Detail")}
                  </button>
                </div>
              </div>
            </div>
            {expandedId === row.frameworkId ? <ExplanationPanel row={row} lang={lang} t={t} /> : null}
          </article>
        ))}
        {!rows.length ? <span style={{ color: t.muted, fontSize: 12 }}>{displayValue(null, "No preview candidates loaded")}</span> : null}
      </div>
    </section>
  )
}
