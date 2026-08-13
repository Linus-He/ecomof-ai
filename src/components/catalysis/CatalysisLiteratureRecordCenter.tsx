// @ts-nocheck
import { useEffect, useState } from "react"
import {
  ArrowSquareOut,
  Database,
  ListChecks,
} from "@phosphor-icons/react"
import {
  BasisBadge,
  getCatalysisEvidenceGraphV2,
  getCatalysisReactionDatabaseV2,
  getCatalysisReactionRecordsV1,
  getCatalysisVerificationTasksV2,
} from "../../shared"
import { CatalysisReactionRecordWorkbench } from "./CatalysisReactionRecordWorkbench"
import { CatalysisVerificationCenter } from "./CatalysisVerificationCenter"

const CENTER_VIEWS = [
  { id: "records", zh: "反应记录与条件", en: "Records and conditions", icon: Database },
  { id: "verification", zh: "来源核验与使用范围", en: "Evidence and admission", icon: ListChecks },
]

function CenterViewTabs({ activeView, onChange, t, zh, isMobile }) {
  return (
    <div className="glass-segmented-control catalysis-center-tabs" aria-label={zh ? "催化文献与反应记录中心视图" : "Catalysis literature and reaction record center views"} role="tablist">
      {CENTER_VIEWS.map(view => {
        const Icon = view.icon
        const selected = activeView === view.id
        return (
          <button
            key={view.id}
            className="glass-segmented-item"
            data-active={selected ? "true" : "false"}
            aria-controls={`catalysis-center-panel-${view.id}`}
            aria-selected={selected}
            id={`catalysis-center-tab-${view.id}`}
            onClick={() => onChange(view.id)}
            role="tab"
            type="button"
            style={{ color: selected ? t.accentText : t.muted }}
          >
            <Icon aria-hidden size={15} weight={selected ? "fill" : "regular"} />
            {zh ? view.zh : view.en}
          </button>
        )
      })}
    </div>
  )
}

export function CatalysisLiteratureRecordCenter({ lang = "zh", t, isMobile = false, recordDataset = null, verificationDatabase = null, verificationTasks = null, evidenceGraph = null }) {
  const zh = lang === "zh"
  const [activeView, setActiveView] = useState("records")
  const [datasets, setDatasets] = useState({
    evidenceGraph,
    recordDataset,
    verificationDatabase,
    verificationTasks,
  })
  const [loadStatus, setLoadStatus] = useState(
    recordDataset && verificationDatabase && verificationTasks && evidenceGraph ? "loaded" : "loading",
  )

  useEffect(() => {
    if (recordDataset && verificationDatabase && verificationTasks && evidenceGraph) {
      setDatasets({ evidenceGraph, recordDataset, verificationDatabase, verificationTasks })
      setLoadStatus("loaded")
      return undefined
    }

    let active = true
    setLoadStatus("loading")
    Promise.all([
      recordDataset ? Promise.resolve(recordDataset) : getCatalysisReactionRecordsV1({ throwOnError: true }),
      verificationDatabase ? Promise.resolve(verificationDatabase) : getCatalysisReactionDatabaseV2({ throwOnError: true }),
      verificationTasks ? Promise.resolve(verificationTasks) : getCatalysisVerificationTasksV2({ throwOnError: true }),
      evidenceGraph ? Promise.resolve(evidenceGraph) : getCatalysisEvidenceGraphV2({ throwOnError: true }),
    ]).then(([nextRecords, nextDatabase, nextTasks, nextGraph]) => {
      if (!active) return
      setDatasets({
        evidenceGraph: nextGraph,
        recordDataset: nextRecords,
        verificationDatabase: nextDatabase,
        verificationTasks: nextTasks,
      })
      setLoadStatus("loaded")
    }).catch(() => {
      if (active) setLoadStatus("error")
    })
    return () => { active = false }
  }, [evidenceGraph, recordDataset, verificationDatabase, verificationTasks])

  return (
    <section id="catalysis-literature-record-center" data-testid="catalysis-literature-record-center" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 14, padding: isMobile ? 12 : 16 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, minWidth: 0, maxWidth: 900 }}>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, lineHeight: 1.2, margin: 0 }}>{zh ? "催化文献与反应记录中心" : "Catalysis literature and reaction record center"}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>
            {zh
              ? "在同一中心查看 DOI 已核对的反应记录、实验条件与活性相证据，并逐条检查数值来源、结构身份、数据许可和可用范围。论文身份已确认，不代表其中每项实验声明均已完成核对。"
              : "Use one center to inspect DOI-verified reaction records, conditions, and active phases, then trace claim locations, structure identity, license, admission eligibility, and open tasks. Both views share the evidence layer without treating article identity as experimental-claim verification."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <BasisBadge tone="calc">{zh ? "文献核对数据" : "Literature curated"}</BasisBadge>
            <BasisBadge tone="warn">{zh ? "禁止跨条件排名" : "No cross-condition ranking"}</BasisBadge>
            <BasisBadge tone="proxy">{zh ? "未核对数据不用于比较或训练" : "Unresolved items stay blocked"}</BasisBadge>
          </div>
        </div>
        <a href="#methodology-catalysis-lab" style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 6, minHeight: 32, padding: "0 10px", textDecoration: "none" }}>
          {zh ? "查看方法标准" : "Method standard"}<ArrowSquareOut aria-hidden size={13} />
        </a>
      </header>

      <CenterViewTabs activeView={activeView} isMobile={isMobile} onChange={setActiveView} t={t} zh={zh} />

      {loadStatus === "loading" ? <div role="status" style={{ color: t.muted, fontSize: 11, minHeight: 120, padding: 12 }}>{zh ? "正在读取催化反应与核验记录…" : "Loading catalysis reaction and verification records…"}</div> : null}
      {loadStatus === "error" ? <div role="alert" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 6, color: t.warn, fontSize: 11, padding: "10px 12px" }}>{zh ? "催化反应与核验记录加载失败，请检查数据文件。" : "Catalysis reaction and verification records failed to load. Check the data files."}</div> : null}
      {loadStatus === "loaded" ? <>
        <div aria-labelledby="catalysis-center-tab-records" hidden={activeView !== "records"} id="catalysis-center-panel-records" role="tabpanel" style={{ minWidth: 0 }}>
          <CatalysisReactionRecordWorkbench dataset={datasets.recordDataset} embedded isMobile={isMobile} lang={lang} t={t} verificationDatabase={datasets.verificationDatabase} />
        </div>
        <div aria-labelledby="catalysis-center-tab-verification" hidden={activeView !== "verification"} id="catalysis-center-panel-verification" role="tabpanel" style={{ minWidth: 0 }}>
          <CatalysisVerificationCenter database={datasets.verificationDatabase} embedded graph={datasets.evidenceGraph} isMobile={isMobile} lang={lang} t={t} tasksDataset={datasets.verificationTasks} />
        </div>
      </> : null}
    </section>
  )
}

export default CatalysisLiteratureRecordCenter
