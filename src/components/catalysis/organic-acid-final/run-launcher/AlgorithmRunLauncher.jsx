// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { ChemicalText } from "../../../common/ChemicalFormula"
import { buildRunSteps, runDemoScreeningWorkflow } from "../../../../utils/organicAcidFinalScreening"
import { Panel, StatusPill, text } from "../FinalScreeningShared"
import { RunConfigurationPanel } from "./RunConfigurationPanel"
import { RunResultSummary } from "./RunResultSummary"
import { RunStepTimeline } from "./RunStepTimeline"
import { RunTracePanel } from "./RunTracePanel"
import { RUN_MODULES, WorkflowModuleSelector } from "./WorkflowModuleSelector"

export function AlgorithmRunLauncher({ frameworks = [], metals = [], rules = {}, evidenceRecords = [], result, curatedRealExamples = null, curatedRealResult = null, onTraceReady, lang, t, isMobile }) {
  const [dataMode, setDataMode] = useState("demo_workflow")
  const [selectedModules, setSelectedModules] = useState(RUN_MODULES.map(row => row[0]))
  const [runStatus, setRunStatus] = useState("idle")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [workflow, setWorkflow] = useState(null)
  const [traceOpen, setTraceOpen] = useState(false)
  const timers = useRef([])

  const activeResult = dataMode === "curated_real_examples" ? curatedRealResult : result
  const baseSteps = useMemo(() => buildRunSteps(activeResult || {}, { dataMode }), [activeResult, dataMode])
  const displayedSteps = workflow?.steps || baseSteps

  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), [])

  const run = () => {
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current = []
    setTraceOpen(false)
    setWorkflow(null)
    setRunStatus("running")
    setActiveIndex(0)

    const steps = baseSteps.length || 10
    for (let index = 0; index < steps; index += 1) {
      timers.current.push(window.setTimeout(() => setActiveIndex(index), 90 * index))
    }
    timers.current.push(window.setTimeout(() => {
      const output = runDemoScreeningWorkflow(frameworks, metals, rules, evidenceRecords, {
        dataMode,
        selectedModules,
        curatedRealExamples,
        curatedRealResult,
      })
      setWorkflow(output)
      onTraceReady?.(output.trace)
      setRunStatus(output.status === "blocked" ? "blocked" : "completed")
      setActiveIndex(-1)
    }, 90 * steps + 120))
  }

  return (
    <Panel
      id="organic-acid-final-run-launcher"
      eyebrow={text(lang, "V1.6 · 小规模真实样例运行", "V1.6 · small curated sample run")}
      title={text(lang, "算法运行启动器", "Algorithm Run Launcher")}
      t={t}
      actions={<StatusPill tone="proxy" t={t}>demo / mapped / curated sample</StatusPill>}
    >
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "这里串联 demo、mapped fixture 与 V1.6 小规模人工整理真实样例。Curated 模式只用于验证 mapper、quality gate、fieldSources 与 hot spot 投影，不做全量数据库计算。",
          "This chains demo, mapped fixtures, and the V1.6 small curated real-example sample. Curated mode validates mapper, quality gate, fieldSources, and hot spot projection; it does not run full database screening."
        )} />
      </p>

      <RunConfigurationPanel dataMode={dataMode} setDataMode={setDataMode} lang={lang} t={t} isMobile={isMobile} />
      <WorkflowModuleSelector selectedModules={selectedModules} setSelectedModules={setSelectedModules} lang={lang} t={t} />

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={run}
          disabled={runStatus === "running"}
          style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", cursor: runStatus === "running" ? "wait" : "pointer", fontSize: 12.5, fontWeight: 930, minHeight: 38, padding: "8px 13px" }}
        >
          {dataMode === "curated_real_examples"
            ? text(lang, "运行 Curated 小样例", "Run curated sample")
            : text(lang, "运行演示筛选", "Run demo screening")}
        </button>
        <button
          type="button"
          onClick={() => setTraceOpen(open => !open)}
          disabled={!workflow?.trace}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: workflow?.trace ? t.accentText : t.faint, cursor: workflow?.trace ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 36, padding: "7px 11px" }}
        >
          {text(lang, "查看运行追踪", "View run trace")}
        </button>
      </div>

      <RunStepTimeline steps={displayedSteps} activeIndex={activeIndex} runStatus={runStatus} lang={lang} t={t} isMobile={isMobile} />
      <RunResultSummary summary={workflow?.summary} trace={workflow?.trace} lang={lang} t={t} isMobile={isMobile} />
      <RunTracePanel open={traceOpen} trace={workflow?.trace} lang={lang} t={t} />
    </Panel>
  )
}
