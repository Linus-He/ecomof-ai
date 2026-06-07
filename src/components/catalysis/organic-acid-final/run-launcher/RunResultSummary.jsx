// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { MiniMetric, StatusPill, displayValue, formatScore, text } from "../FinalScreeningShared"

function openTraceWorkbench() {
  if (typeof document === "undefined") return
  document.getElementById("organic-acid-final-trace-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function TraceWorkbenchButton({ trace, lang, t }) {
  if (!trace?.runId) return null
  return (
    <button
      type="button"
      onClick={openTraceWorkbench}
      style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}
    >
      {text(lang, "打开 Trace Workbench", "Open Trace Workbench")}
    </button>
  )
}

export function RunResultSummary({ summary, trace, lang, t, isMobile }) {
  if (!summary) return null
  const isCurated = summary.dataMode === "curated_real_examples"
  if (isCurated) {
    return (
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 10 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "运行结果摘要", "Run Result Summary")}</strong>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
            <StatusPill tone="warn" t={t}>small curated sample only</StatusPill>
            <TraceWorkbenchButton trace={trace} lang={lang} t={t} />
          </div>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <MiniMetric label={text(lang, "骨架样例", "Framework records")} value={summary.frameworkRecords} t={t} />
          <MiniMetric label={text(lang, "可评分", "Ready")} value={summary.readyForScoring} t={t} tone="info" />
          <MiniMetric label={text(lang, "需复核", "Needs review")} value={summary.needsReview} t={t} tone="warn" />
          <MiniMetric label={text(lang, "硬阈值拒绝", "Rejected")} value={summary.rejected} t={t} tone="warn" />
          <MiniMetric label={text(lang, "DOI 覆盖率", "DOI coverage")} value={`${Math.round((summary.doiCoverage || 0) * 100)}%`} t={t} tone="warn" />
          <MiniMetric label={text(lang, "字段来源覆盖", "Field provenance")} value={`${Math.round((summary.fieldProvenanceCoverage || 0) * 100)}%`} t={t} />
          <MiniMetric label={text(lang, "未匹配 QMOF", "Unmatched QMOF")} value={summary.unmatchedQmofDescriptorRecords} t={t} tone="warn" />
          <MiniMetric label={text(lang, "热区投影", "Hot spot projection")} value={summary.hotSpotProjectionStatus} t={t} />
        </div>
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12.2, fontWeight: 850, lineHeight: 1.5, padding: 9 }}>
          <ChemicalText value={displayValue(text(lang, summary.evidenceBoundaryZh, summary.evidenceBoundary))} />
        </div>
      </section>
    )
  }
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "运行结果摘要", "Run Result Summary")}</strong>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
          <StatusPill tone="warn" t={t}>demo / proxy run</StatusPill>
          <TraceWorkbenchButton trace={trace} lang={lang} t={t} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <MiniMetric label={text(lang, "选定骨架", "Selected scaffold")} value={summary.selectedScaffold} t={t} />
        <MiniMetric label="OACS" value={formatScore(summary.oacs)} t={t} />
        <MiniMetric label={text(lang, "Top dopants", "Top dopants")} value={(summary.topDopants || []).join(" / ")} t={t} />
        <MiniMetric label="Mo-W gap" value={formatScore(summary.moWGap)} t={t} />
        <MiniMetric label={text(lang, "稳健性", "Robustness")} value={summary.robustnessStatus} t={t} tone="warn" />
        <MiniMetric label={text(lang, "热区状态", "Hot spot status")} value={summary.hotSpotStatus} t={t} />
        <MiniMetric label={text(lang, "EXAFS 状态", "EXAFS status")} value={summary.exafsHypothesisStatus} t={t} />
      </div>
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12.2, fontWeight: 850, lineHeight: 1.5, padding: 9 }}>
        <ChemicalText value={displayValue(text(lang, summary.evidenceBoundaryZh, summary.evidenceBoundary))} />
      </div>
    </section>
  )
}
