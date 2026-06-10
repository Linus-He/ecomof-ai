// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildMetadataVerificationQueue, metadataTierLabel, metadataTierTone } from "../../utils/databaseIndex/metadataVerification"
import { curationStatusLabel, curationStatusTone, getMetadataCurationStatus } from "../../utils/databaseIndex/metadataCuration"

function priorityTone(priority) {
  if (priority === "high") return "warn"
  if (priority === "medium") return "proxy"
  return "info"
}

function priorityLabel(priority, lang) {
  if (priority === "high") return text(lang, "高", "high")
  if (priority === "medium") return text(lang, "中", "medium")
  return text(lang, "低", "low")
}

export function MetadataVerificationQueuePanel({ records = [], curationRecords = null, lang, t, isMobile }) {
  const { queue, summary } = useMemo(() => buildMetadataVerificationQueue(records, { lang }), [records, lang])
  const curationById = useMemo(() => {
    const map = new Map()
    for (const row of curationRecords || []) map.set(row.recordId, row)
    return map
  }, [curationRecords])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "人工核验队列", "Metadata Verification Queue")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "从已加载候选中挑出优先人工核验对象。不伪造 DOI / license / 来源链接，也不会自动标记为已核验。",
              "Priority candidates picked from loaded records for manual review. No DOI / license / source link is fabricated and nothing is auto-verified."
            )} />
          </span>
        </div>
        <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <StatusPill tone="warn" t={t}>{text(lang, "优先人工核验", "priority manual review")}</StatusPill>
          {curationRecords ? <StatusPill tone="info" t={t}>{text(lang, "整理进度", "curation progress")}</StatusPill> : null}
        </span>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {[
          [text(lang, "队列数量", "Queue size"), summary.queueSize],
          [text(lang, "高优先", "High priority"), summary.priorityCounts.high],
          [text(lang, "接近完成核验", "Near verified"), summary.proposedTierCounts.near_verified],
          [text(lang, "已核验", "Verified"), summary.proposedTierCounts.verified_metadata],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 16 }}>{formatCount(value)}</strong>
          </article>
        ))}
      </div>

      {queue.length ? (
        <div style={{ display: "grid", gap: 7 }}>
          {queue.slice(0, 6).map(item => {
            const curationRow = curationById.get(item.recordId)
            const curationStatus = curationRow ? getMetadataCurationStatus(curationRow) : null
            const showManualCuration = item.priority === "high" && item.proposedVerificationTier === "near_verified"
            return (
              <article key={item.recordId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
                  <strong style={{ color: t.textStrong, fontSize: 12.4 }}><ChemicalText value={item.displayName} /></strong>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    <StatusPill tone={priorityTone(item.priority)} t={t}>{priorityLabel(item.priority, lang)}</StatusPill>
                    <StatusPill tone={metadataTierTone(item.proposedVerificationTier)} t={t}>{metadataTierLabel(item.proposedVerificationTier, lang)}</StatusPill>
                    {curationStatus ? <StatusPill tone={curationStatusTone(curationStatus)} t={t}>{curationStatusLabel(curationStatus, lang)}</StatusPill> : null}
                  </span>
                </div>
                <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4 }}>
                  {text(lang, "待核验", "Pending")}: {item.blockingReasons.join("、") || text(lang, "无", "none")}
                </span>
                {showManualCuration ? (
                  <span style={{ color: t.warn, fontSize: 10.6, fontWeight: 800 }}>{text(lang, "需人工整理", "manual curation required")}</span>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "当前已加载候选中没有需要优先核验的项。", "No priority manual-review items in the currently loaded records.")}</span>
      )}

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, "接近完成核验仅表示优先核验候选，仍不可作为最终推荐。", "Near verified marks priority review candidates only and is still not a final recommendation.")} />
      </p>
    </section>
  )
}

export default MetadataVerificationQueuePanel
