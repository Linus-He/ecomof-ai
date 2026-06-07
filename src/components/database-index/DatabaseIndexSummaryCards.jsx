// @ts-nocheck
import { MiniMetric, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount, summarizeDatabaseOverview } from "../../utils/databaseIndex/databaseIndexFormatters"

export function DatabaseIndexSummaryCards({ overview = {}, lang, t, isMobile }) {
  const summary = summarizeDatabaseOverview(overview)
  const rows = [
    [text(lang, "CoRE-like index records", "CoRE-like index records"), summary.coreRecords],
    [text(lang, "QMOF-like index records", "QMOF-like index records"), summary.qmofRecords],
    [text(lang, "Al-containing records", "Al-containing records"), summary.alContaining],
    [text(lang, "Ready for scoring", "Ready for scoring"), summary.readyForScoring],
    [text(lang, "Needs review", "Needs review"), summary.needsReview, "warn"],
    [text(lang, "Rejected", "Rejected"), summary.rejected, "warn"],
    [text(lang, "Top candidates preview", "Top candidates preview"), summary.topCandidateCount],
    [text(lang, "Detail records", "Detail records"), summary.detailCount],
  ]
  return (
    <section style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(145px, 1fr))" }}>
      {rows.map(([label, value, tone]) => <MiniMetric key={label} label={label} value={formatCount(value)} t={t} tone={tone || "info"} />)}
    </section>
  )
}
