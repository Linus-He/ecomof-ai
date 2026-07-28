// @ts-nocheck
import { MiniMetric, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount, summarizeDatabaseOverview } from "../../utils/databaseIndex/databaseIndexFormatters"

export function DatabaseIndexSummaryCards({ overview = {}, lang, t, isMobile }) {
  const summary = summarizeDatabaseOverview(overview)
  const rows = [
    [text(lang, "CoRE 2024 CR 索引记录", "CoRE 2024 CR index records"), summary.coreRecords],
    [text(lang, "含 Al 记录", "Al-containing records"), summary.alContaining],
    [text(lang, "结构描述符就绪", "Structural descriptors ready"), summary.readyForScoring],
    [text(lang, "需要复核", "Needs review"), summary.needsReview, "warn"],
    [text(lang, "已拒绝", "Rejected"), summary.rejected, "warn"],
    [text(lang, "结构审阅样本", "Structural review sample"), summary.topCandidateCount],
    [text(lang, "详情记录", "Detail records"), summary.detailCount],
  ]
  return (
    <section style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(145px, 1fr))" }}>
      {rows.map(([label, value, tone]) => <MiniMetric key={label} label={label} value={formatCount(value)} t={t} tone={tone || "info"} />)}
    </section>
  )
}
