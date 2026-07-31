// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchJson } from "../../services/dataService"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import {
  buildScreeningNextActions,
  buildScreeningRunResult,
  buildScreeningRunSteps,
  getInitialScreeningRunState,
  runScreeningAuditSimulation,
} from "../../utils/databaseIndex/screeningRunState"
import { ScreeningRunStepper } from "./ScreeningRunStepper"
import { ScreeningResultPanel } from "./ScreeningResultPanel"
import { ScreeningNextActionPanel } from "./ScreeningNextActionPanel"

// Prefer the latest V2.0-L summary; fall back to V2.0-K, then V2.0-I.
const SUMMARY_FILE = "data/database_precompute/v2_0_l/precompute_dry_run_summary.json"
const SUMMARY_FALLBACK_FILES = [
  "data/database_precompute/v2_0_k/precompute_dry_run_summary.json",
  "data/database_precompute/v2_0_i/precompute_dry_run_summary.json",
]

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function ScreeningRunConsole({ summary: summaryProp = null, stepDelayMs = 70, onViewCurationQueue, lang, t, isMobile }) {
  const [summary, setSummary] = useState(summaryProp)
  const [runState, setRunState] = useState(() => (summaryProp ? getInitialScreeningRunState(summaryProp) : { status: "idle", activeIndex: -1, steps: [], result: null }))
  const timers = useRef([])

  useEffect(() => {
    if (summaryProp) return undefined
    let active = true
    fetchJson(SUMMARY_FILE, null)
      .then(payload => payload || fetchJson(SUMMARY_FALLBACK_FILES[0], null))
      .then(payload => payload || fetchJson(SUMMARY_FALLBACK_FILES[1], null))
      .then(payload => {
        if (!active || !payload) return
        setSummary(payload)
        setRunState(getInitialScreeningRunState(payload))
      })
      .catch(() => {})
    return () => { active = false }
  }, [summaryProp])

  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), [])

  const meta = summary?.metadata || {}
  const transition = summary?.metadataTransitionSummary || {}
  const curation = summary?.manualCurationSummary || {}
  const recordsScanned = num(summary?.recordsScanned)
  const nearVerified = num(summary?.nearVerifiedCount ?? transition.nearVerifiedBeforeCuration)

  const nextActions = useMemo(() => (summary ? buildScreeningNextActions(summary) : { actions: [] }), [summary])

  const applyFinal = () => {
    const final = runScreeningAuditSimulation(summary)
    setRunState({ status: final.status, activeIndex: -1, steps: final.steps, result: final.result })
  }

  const run = () => {
    if (!summary) return
    if (recordsScanned === 0) {
      setRunState(state => ({ ...state, status: "blocked" }))
      return
    }
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current = []
    const finalSteps = buildScreeningRunSteps(summary)

    if (stepDelayMs <= 0) {
      applyFinal()
      return
    }

    setRunState({ status: "running", activeIndex: 0, steps: finalSteps.map(s => ({ ...s, status: "pending" })), result: null })
    finalSteps.forEach((_, index) => {
      timers.current.push(window.setTimeout(() => {
        setRunState(state => ({
          ...state,
          status: "running",
          activeIndex: index,
          steps: state.steps.map((s, i) => (i < index ? { ...s, status: finalSteps[i].status } : i === index ? { ...s, status: "running" } : s)),
        }))
      }, stepDelayMs * index))
    })
    timers.current.push(window.setTimeout(applyFinal, stepDelayMs * finalSteps.length + 40))
  }

  const buttonLabel = () => {
    if (runState.status === "running") return text(lang, "正在运行审计…", "Running audit…")
    if (runState.status === "completed") return text(lang, "查看筛选结果", "View screening result")
    if (runState.status === "warning") return text(lang, "查看需补证据项", "View evidence to add")
    if (runState.status === "blocked") return text(lang, "需要先选择数据范围", "Choose a data scope first")
    return text(lang, "开始筛选审计", "Run screening audit")
  }

  const scopeRows = [
    [text(lang, "当前样本", "Current sample"), `${formatCount(recordsScanned)} ${text(lang, "条小规模样本", "small-scale records")}`],
    [text(lang, "人工整理队列", "Manual curation queue"), `${formatCount(num(curation.queueSize))} ${text(lang, "条", "records")}`],
    [text(lang, "near verified", "Near verified"), formatCount(nearVerified)],
    [text(lang, "verified metadata", "Verified metadata"), formatCount(num(meta.verified))],
    [text(lang, "当前边界", "Boundary"), text(lang, "仅限预览 / 不是最终推荐", "Preview only / Not final recommendation")],
  ]

  const showResult = runState.result && (runState.status === "completed" || runState.status === "warning")

  return (
    <section data-testid="screening-run-console" style={{ background: t.surface, border: `1px solid ${t.accentText || t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <strong style={{ color: t.textStrong, fontSize: 17, lineHeight: 1.2 }}>{text(lang, "有机酸候选筛选运行台", "Organic Acid Screening Run Console")}</strong>
        <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.5 }}>
          <ChemicalText value={text(
            lang,
            "运行当前已加载样本的筛选审计链，检查 metadata、描述符、机制代理、敏感性与候选验证路线。",
            "Run the screening audit chain for currently loaded samples, covering metadata, descriptors, mechanism proxies, sensitivity, and validation roadmap."
          )} />
        </span>
      </header>

      <div style={{ alignItems: "stretch", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
        <div style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {scopeRows.map(([label, value]) => (
            <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 3, padding: 9 }}>
              <span style={{ color: t.faint, fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{value}</strong>
            </article>
          ))}
        </div>

        <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 9, justifyContent: "center" }}>
          <button
            type="button"
            data-testid="screening-run-button"
            onClick={run}
            disabled={runState.status === "running" || !summary}
            style={{
              background: runState.status === "blocked" ? t.warn : t.accent,
              border: `1px solid ${runState.status === "blocked" ? t.warn : t.accent}`,
              borderRadius: 10,
              color: t.buttonText || "#fff",
              cursor: runState.status === "running" ? "wait" : "pointer",
              fontSize: 15,
              fontWeight: 940,
              minHeight: 52,
              padding: "13px 22px",
              width: "100%",
            }}
          >
            {buttonLabel()}
          </button>
          <button
            type="button"
            onClick={() => onViewCurationQueue?.()}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 38, padding: "8px 13px", width: "100%" }}
          >
            {text(lang, "查看人工整理队列", "View curation queue")}
          </button>
        </div>
      </div>

      <p style={{ color: t.muted, fontSize: 11.4, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "本次运行不会执行全量数据库筛选，不会训练模型，也不会生成最终推荐。",
          "This run does not perform full database screening, model training, or final recommendation."
        )} />
      </p>

      {runState.steps.length && runState.status !== "idle" ? (
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "筛选运行过程", "Screening run progress")}</strong>
          <ScreeningRunStepper steps={runState.steps} activeIndex={runState.activeIndex} lang={lang} t={t} />
        </div>
      ) : null}

      {runState.status === "blocked" ? (
        <div style={{ background: t.badgeBadBg || "#fee2e2", border: `1px solid ${t.bad || "#b91c1c"}`, borderRadius: 10, color: t.bad || "#b91c1c", fontSize: 12, fontWeight: 800, lineHeight: 1.45, padding: 11 }}>
          {text(lang, "需要先选择数据范围才能运行筛选审计。", "Choose a data scope before running the screening audit.")}
        </div>
      ) : null}

      {showResult ? (
        <div style={{ display: "grid", gap: 11 }}>
          {num(meta.verified) === 0 ? (
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.textStrong, display: "grid", gap: 3, padding: 11 }}>
              <strong style={{ fontSize: 12.6 }}>{text(lang, "暂无经核验候选", "No verified candidates yet")}</strong>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>
                <ChemicalText value={text(
                  lang,
                  "当前所有候选仍需人工补充 source / citation / license / DOI。筛选结果仅用于确定人工核验优先级。",
                  "All candidates still require source / citation / license / DOI curation. The screening result only prioritizes manual verification."
                )} />
              </span>
            </div>
          ) : null}
          {num(transition.sourceConfirmed) === 0 ? (
            <div style={{ background: t.panel, border: `1px dashed ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", gap: 3, padding: 10 }}>
              <strong style={{ color: t.warn, fontSize: 12 }}>{text(lang, "来源链接补全尚未开始", "Source-link enrichment has not started")}</strong>
              <span style={{ fontSize: 11.4, lineHeight: 1.45 }}>{text(lang, "来源链接缺失；须在人工元数据整理面板补录后继续。", "Please add source URLs in the manual metadata curation panel first.")}</span>
            </div>
          ) : null}
          <ScreeningResultPanel result={runState.result} lang={lang} t={t} isMobile={isMobile} />
          <ScreeningNextActionPanel nextActions={nextActions} lang={lang} t={t} />
        </div>
      ) : null}
    </section>
  )
}

export default ScreeningRunConsole
