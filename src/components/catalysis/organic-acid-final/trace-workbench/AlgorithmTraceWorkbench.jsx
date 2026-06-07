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
          <TraceRunOverview trace={trace} lang={lang} t={t} isMobile={isMobile} />
          <TraceWarningBoundaryPanel warnings={trace.warnings} boundaries={trace.boundaries} lang={lang} t={t} isMobile={isMobile} />
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

