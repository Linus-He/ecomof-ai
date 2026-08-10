// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbRenderText, dbStatusLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { buildCandidateExplanation, formatPercentValue, matchesDatabaseIndexFilters, normalizeTopCandidates, qualityTone } from "../../utils/databaseIndex/databaseIndexFormatters"

function ExplanationPanel({ row, lang, t }) {
  const explanation = buildCandidateExplanation(row)
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.6 }}>{dbText(lang, "whyInPreview")}</strong>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))" }}>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>{text(lang, "审阅序号：", "Review order:")}</b> #{displayValue(explanation.rank)}</span>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>descriptor:</b> {formatPercentValue(explanation.descriptorCompleteness)}</span>
        <span style={{ color: t.muted, fontSize: 11.8 }}><b style={{ color: t.textStrong }}>provenance:</b> {formatPercentValue(explanation.provenanceCompleteness)}</span>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "主要正向因素", "Main positive factors")}</span>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={lang === "zh" ? "结构描述符完整度、来源记录、金属节点和按需详情共同决定该审阅样本。" : (explanation.positiveFactors.length ? explanation.positiveFactors.join("; ") : "deterministic structural review sample")} /></span>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "主要缺失字段", "Main missing fields")}</span>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={explanation.missingFields.length ? explanation.missingFields.join(", ") : text(lang, "当前结构审阅字段完整", "current structural-review fields complete")} /></span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Descriptor availability", "Descriptor availability")}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {explanation.descriptorAvailability.map(descriptor => (
            <StatusBadge key={descriptor.id} tone={descriptor.available ? "pass" : "warn"} t={t}>{`${descriptor.label}: ${descriptor.available ? text(lang, "可用", "available") : dbText(lang, "evidencePending")}`}</StatusBadge>
          ))}
        </div>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6 }}>
        <StatusBadge tone={qualityTone(explanation.qualityStatus)} t={t}>{dbStatusLabel(explanation.qualityStatus, lang)}</StatusBadge>
        <StatusBadge tone="pass" t={t}>{text(lang, "来源元数据已接入", "source metadata available")}</StatusBadge>
      </div>
      <p style={{ color: t.warn, fontSize: 12, fontWeight: 900, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该序号只用于结构记录审阅，不是有机酸催化性能排名。",
          "This order is for structural-record review only, not an organic-acid catalytic-performance ranking."
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
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "结构完整度审阅样本", "Descriptor-completeness Review Sample")}</strong>
          <span style={{ color: t.muted, fontSize: 11.8 }}>{text(lang, "用于检查记录、描述符和按需详情；不是 OACS 或催化性能排序。", "Used to inspect records, descriptors, and on-demand details; not an OACS or catalytic-performance ranking.")}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusBadge tone="proxy" t={t}>{text(lang, `显示 ${rows.length} 个`, `${rows.length} shown`)}</StatusBadge>
          <StatusBadge tone="warn" t={t}>{text(lang, "非催化性能排名", "not catalytic-performance ranking")}</StatusBadge>
        </div>
      </header>
      <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, "这些记录按结构描述符完整度确定性选取，仅作为审阅入口，不代表它们是有机酸路线的最优 MOF。", "These records are selected deterministically by structural descriptor completeness as review entries; they are not the best MOFs for an organic-acid route.")} />
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
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{formatPercentValue(row.descriptorCompletenessPercent)}</span>
                  <StatusBadge tone={qualityTone(row.dataQualityStatus)} t={t}>{dbStatusLabel(row.dataQualityStatus, lang)}</StatusBadge>
                </div>
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
