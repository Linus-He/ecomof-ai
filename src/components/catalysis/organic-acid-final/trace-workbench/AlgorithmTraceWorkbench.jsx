// @ts-nocheck
import { useMemo, useState } from "react"
import { isRunTrace } from "../../../../schemas/organicAcidTraceSchema"
import { Panel, StatusPill, text } from "../FinalScreeningShared"
import { CandidateDecisionLog } from "./CandidateDecisionLog"
import { CandidateFlowDiagram } from "./CandidateFlowDiagram"
import { EvidenceTracePanel } from "./EvidenceTracePanel"
import { FormulaWeightInspector } from "./FormulaWeightInspector"
import { TraceEmptyState } from "./TraceEmptyState"
import { TraceExportPanel } from "./TraceExportPanel"
import { TraceRunOverview } from "./TraceRunOverview"
import { TraceStepInspector } from "./TraceStepInspector"
import { TraceStepTimeline } from "./TraceStepTimeline"
import { TraceWarningBoundaryPanel } from "./TraceWarningBoundaryPanel"

export function AlgorithmTraceWorkbench({ trace, lang, t, isMobile }) {
  const ready = isRunTrace(trace)
  const isDatabaseIndexTrace = trace?.dataMode === "database_index_preview"
  const [activeStepId, setActiveStepId] = useState("")
  const activeStep = useMemo(() => {
    const steps = trace?.steps || []
    return steps.find(step => step.id === activeStepId) || steps[0] || null
  }, [activeStepId, trace])

  return (
    <Panel
      id="organic-acid-final-trace-workbench"
      eyebrow={text(lang, "V1.7 · Algorithm Trace Workbench", "V1.7 · Algorithm Trace Workbench")}
      title={text(lang, "算法追踪工作台：可审计计算链", "Algorithm Trace Workbench: Auditable Computation Chain")}
      t={t}
      actions={<StatusPill tone={ready ? "pass" : "warn"} t={t}>{ready ? trace.runId : "Run required"}</StatusPill>}
    >
      {!ready ? <TraceEmptyState lang={lang} t={t} /> : (
        <div style={{ display: "grid", gap: 14 }}>
          {isDatabaseIndexTrace ? (
            <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", fontSize: 12.3, gap: 5, lineHeight: 1.5, padding: 10 }}>
              <strong style={{ color: t.warn }}>{text(lang, "索引层 trace 边界", "Index-level trace boundary")}</strong>
              <span>{text(lang, "大规模数据追踪在索引层进行摘要，避免审计信息过载。Trace 只覆盖数据清单、汇总、Top candidates、当前加载分片与当前打开详情。", "Large-scale trace is summarized at index level to keep the audit readable. Trace covers only the data manifest, summaries, top candidates, the current loaded part, and the current opened detail.")}</span>
            </section>
          ) : null}
          <TraceRunOverview trace={trace} lang={lang} t={t} isMobile={isMobile} />
          <TraceWarningBoundaryPanel warnings={trace.warnings} warningsZh={trace.warningsZh} boundaries={trace.boundaries} lang={lang} t={t} isMobile={isMobile} />
          <CandidateFlowDiagram flow={trace.candidateFlow} lang={lang} t={t} />
          <TraceStepTimeline steps={trace.steps} activeStepId={activeStep?.id} setActiveStepId={setActiveStepId} lang={lang} t={t} isMobile={isMobile} />
          <TraceStepInspector step={activeStep} lang={lang} t={t} />
          <FormulaWeightInspector formulas={trace.formulaTraces} lang={lang} t={t} isMobile={isMobile} />
          <CandidateDecisionLog decisions={trace.candidateDecisions} lang={lang} t={t} isMobile={isMobile} />
          <EvidenceTracePanel evidenceTraces={trace.evidenceTraces} lang={lang} t={t} />
          <TraceExportPanel trace={trace} lang={lang} t={t} />
        </div>
      )}
    </Panel>
  )
}
