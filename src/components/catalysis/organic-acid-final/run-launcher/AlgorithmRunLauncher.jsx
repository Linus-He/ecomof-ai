// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { ChemicalText } from "../../../common/ChemicalFormula"
import { buildRunSteps, runDemoScreeningWorkflow } from "../../../../utils/organicAcidFinalScreening"
import { loadDatabaseIndexOverview } from "../../../../utils/databaseIndex/databaseIndexLoaders"
import { Panel, StatusPill, text } from "../FinalScreeningShared"
import { RunConfigurationPanel } from "./RunConfigurationPanel"
import { RunResultSummary } from "./RunResultSummary"
import { RunStepTimeline } from "./RunStepTimeline"
import { RunTracePanel } from "./RunTracePanel"
import { RUN_MODULES, WorkflowModuleSelector } from "./WorkflowModuleSelector"

export function AlgorithmRunLauncher({ frameworks = [], metals = [], rules = {}, evidenceRecords = [], result, curatedRealExamples = null, curatedRealResult = null, databaseIndexOverview = null, onDatabaseIndexOverviewReady, onTraceReady, lang, t, isMobile }) {
  const [dataMode, setDataMode] = useState("demo_workflow")
  const [selectedModules, setSelectedModules] = useState(RUN_MODULES.map(row => row[0]))
  const [runStatus, setRunStatus] = useState("idle")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [workflow, setWorkflow] = useState(null)
  const [traceOpen, setTraceOpen] = useState(false)
  const [databaseOverview, setDatabaseOverview] = useState(databaseIndexOverview)
  const [databaseStatus, setDatabaseStatus] = useState(databaseIndexOverview ? "loaded" : "idle")
  const timers = useRef([])

  useEffect(() => {
    if (databaseIndexOverview) {
      setDatabaseOverview(databaseIndexOverview)
      setDatabaseStatus(databaseIndexOverview.errors?.length ? "warning" : "loaded")
    }
  }, [databaseIndexOverview])

  useEffect(() => {
    let active = true
    if (dataMode !== "database_index_preview" || databaseOverview) return undefined
    setDatabaseStatus("loading")
    loadDatabaseIndexOverview().then(overview => {
      if (!active) return
      setDatabaseOverview(overview)
      onDatabaseIndexOverviewReady?.(overview)
      setDatabaseStatus(overview.errors?.length ? "warning" : "loaded")
    }).catch(error => {
      if (!active) return
      console.warn("Database index overview for Run Launcher could not be loaded.", error)
      setDatabaseOverview({ errors: [{ message: error?.message || "Database index overview failed to load." }] })
      setDatabaseStatus("error")
    })
    return () => { active = false }
  }, [dataMode, databaseOverview, onDatabaseIndexOverviewReady])

  const activeResult = dataMode === "curated_real_examples"
    ? curatedRealResult
    : dataMode === "database_index_preview"
      ? (databaseOverview || {})
      : result
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
    timers.current.push(window.setTimeout(async () => {
      let overview = databaseOverview
      if (dataMode === "database_index_preview" && !overview) {
        setDatabaseStatus("loading")
        overview = await loadDatabaseIndexOverview()
        setDatabaseOverview(overview)
        onDatabaseIndexOverviewReady?.(overview)
        setDatabaseStatus(overview.errors?.length ? "warning" : "loaded")
      }
      const output = runDemoScreeningWorkflow(frameworks, metals, rules, evidenceRecords, {
        dataMode,
        selectedModules,
        curatedRealExamples,
        curatedRealResult,
        databaseIndexOverview: overview,
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
      actions={<StatusPill tone="proxy" t={t}>demo / mapped / curated / index preview</StatusPill>}
    >
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "这里串联 demo、mapped fixture、V1.6 小规模人工整理真实样例与 V2.0-C database index preview。数据库索引模式只加载 manifest 与预计算 Top-N 预览，不在浏览器中运行全量数据库评分。",
          "This chains demo, mapped fixtures, the V1.6 small curated real-example sample, and the V2.0-C database index preview. Database index mode loads manifest and precomputed Top-N preview only; it does not run full database scoring in the browser."
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
          {dataMode === "database_index_preview"
            ? text(lang, "运行数据库索引预览", "Run database index preview")
            : dataMode === "curated_real_examples"
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

      {dataMode === "database_index_preview" ? (
        <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", fontSize: 12.2, gap: 5, lineHeight: 1.48, padding: 10 }}>
          <strong style={{ color: t.warn }}>{text(lang, "Database index preview boundary", "Database index preview boundary")}</strong>
          <ChemicalText value={text(
            lang,
            "该模式只加载 manifest 与预计算 Top-N 预览，不在浏览器中运行全量数据库评分。Trace 只覆盖当前预览子集，不覆盖全量数据库。",
            "This mode loads manifest and precomputed Top-N preview only. It does not run full database scoring in the browser. Trace is limited to the current preview subset, not full database."
          )} />
          <StatusPill tone={databaseStatus === "loaded" ? "pass" : databaseStatus === "error" ? "warn" : "proxy"} t={t}>{databaseStatus}</StatusPill>
        </section>
      ) : null}

      <RunStepTimeline steps={displayedSteps} activeIndex={activeIndex} runStatus={runStatus} lang={lang} t={t} isMobile={isMobile} />
      <RunResultSummary summary={workflow?.summary} trace={workflow?.trace} lang={lang} t={t} isMobile={isMobile} />
      <RunTracePanel open={traceOpen} trace={workflow?.trace} lang={lang} t={t} />
    </Panel>
  )
}
