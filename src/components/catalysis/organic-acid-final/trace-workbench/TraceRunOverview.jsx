// @ts-nocheck
import { MiniMetric, StatusPill, displayValue, formatScore, text } from "../FinalScreeningShared"

export function TraceRunOverview({ trace, lang, t, isMobile }) {
  const summary = trace?.outputSummary || {}
  const input = trace?.inputSummary || {}
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 3, lineHeight: 1.45 }}>
          <span><strong style={{ color: t.textStrong }}>runId:</strong> {displayValue(trace?.runId)}</span>
          <span><strong style={{ color: t.textStrong }}>createdAt:</strong> {displayValue(trace?.createdAt)}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <StatusPill tone={trace?.status?.includes("warning") ? "warn" : "pass"} t={t}>{trace?.status || "pending"}</StatusPill>
          <StatusPill tone="proxy" t={t}>{trace?.workflowVersion || "V1.7"}</StatusPill>
          <StatusPill tone="info" t={t}>{trace?.dataMode || "demo_workflow"}</StatusPill>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <MiniMetric label={text(lang, "输入骨架", "Input frameworks")} value={input.frameworkCandidates} t={t} />
        <MiniMetric label={text(lang, "输入金属", "Input metals")} value={input.metalCandidates} t={t} />
        <MiniMetric label={text(lang, "证据记录", "Evidence records")} value={input.evidenceRecords} t={t} />
        <MiniMetric label={text(lang, "选定骨架", "Selected scaffold")} value={summary.selectedScaffold} t={t} />
        <MiniMetric label="OACS" value={formatScore(summary.oacs)} t={t} />
        <MiniMetric label="Mo-W gap" value={formatScore(summary.moWGap)} t={t} tone="warn" />
      </div>
    </section>
  )
}

