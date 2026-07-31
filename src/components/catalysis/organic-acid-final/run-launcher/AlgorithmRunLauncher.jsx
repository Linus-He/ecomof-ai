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
      console.warn("Database index overview for screening entry could not be loaded.", error)
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
      eyebrow={text(lang, "筛选输入与运行范围", "Screening input and run scope")}
      title={text(lang, "筛选运行范围", "Screening Run Scope")}
      t={t}
      actions={<StatusPill tone="proxy" t={t}>{text(lang, "当前边界：V2.0-F 试算 / 仅限预览", "Current boundary: V2.0-F trial scoring / preview only")}</StatusPill>}
    >
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "选择当前要审计的候选来源。浏览器只处理已加载数据，不执行全量数据库评分。当前运行只审计已加载候选，用于检查数据质量、metadata 核验状态、评分链路与证据边界。",
          "Choose the candidate source to audit. The browser only processes loaded records and does not run full database scoring. The current run audits loaded candidates only, to check data quality, metadata verification status, the scoring chain, and evidence boundaries."
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
            ? text(lang, "运行 CoRE 结构索引审计", "Run CoRE structural-index audit")
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
          {text(lang, "查看运行审计记录", "View run audit record")}
        </button>
      </div>

      {dataMode === "database_index_preview" ? (
        <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", fontSize: 12.2, gap: 5, lineHeight: 1.48, padding: 10 }}>
          <strong style={{ color: t.warn }}>{text(lang, "CoRE 结构索引审计边界", "CoRE structural-index audit boundary")}</strong>
          <ChemicalText value={text(
            lang,
            "来源索引覆盖全部 9,835 条真实 CR 记录；浏览器当前只展开结构审阅样本与已选择分片，不把结构完整度当作催化性能评分。追踪覆盖来源清单和当前展开范围。",
            "The source index covers all 9,835 real CR records. The browser expands only the structural-review sample and selected part, and never treats structural completeness as catalytic-performance scoring. Trace covers the source manifest and current expanded scope."
          )} />
          <StatusPill tone={databaseStatus === "loaded" ? "pass" : databaseStatus === "error" ? "warn" : "proxy"} t={t}>{text(lang, "真实结构索引", "Real structure index")}</StatusPill>
        </section>
      ) : null}

      <RunStepTimeline steps={displayedSteps} activeIndex={activeIndex} runStatus={runStatus} lang={lang} t={t} isMobile={isMobile} />
      <RunResultSummary summary={workflow?.summary} trace={workflow?.trace} lang={lang} t={t} isMobile={isMobile} />
      <RunTracePanel open={traceOpen} trace={workflow?.trace} lang={lang} t={t} />
    </Panel>
  )
}
