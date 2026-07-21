// @ts-nocheck
import { MiniMetric, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount, summarizeDatabaseOverview } from "../../utils/databaseIndex/databaseIndexFormatters"

export function DatabaseIndexSummaryCards({ overview = {}, lang, t, isMobile }) {
  const summary = summarizeDatabaseOverview(overview)
  const rows = [
    [text(lang, "CoRE-like 索引记录", "CoRE-like index records"), summary.coreRecords],
    [text(lang, "QMOF-like 索引记录", "QMOF-like index records"), summary.qmofRecords],
    [text(lang, "含 Al 记录", "Al-containing records"), summary.alContaining],
    [text(lang, "可评分记录", "Ready for scoring"), summary.readyForScoring],
    [text(lang, "需要复核", "Needs review"), summary.needsReview, "warn"],
    [text(lang, "已拒绝", "Rejected"), summary.rejected, "warn"],
    [text(lang, "Top 候选预览", "Top candidates preview"), summary.topCandidateCount],
    [text(lang, "详情记录", "Detail records"), summary.detailCount],
  ]
  return (
    <section style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(145px, 1fr))" }}>
      {rows.map(([label, value, tone]) => <MiniMetric key={label} label={label} value={formatCount(value)} t={t} tone={tone || "info"} />)}
    </section>
  )
}
