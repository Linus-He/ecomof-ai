// @ts-nocheck
import { useState } from "react"
import {
  ArrowSquareOut,
  Database,
  ListChecks,
} from "@phosphor-icons/react"
import { BasisBadge } from "../../shared"
import { CatalysisReactionRecordWorkbench } from "./CatalysisReactionRecordWorkbench"
import { CatalysisVerificationCenter } from "./CatalysisVerificationCenter"

const CENTER_VIEWS = [
  { id: "records", zh: "反应记录与条件", en: "Records and conditions", icon: Database },
  { id: "verification", zh: "来源核验与使用范围", en: "Evidence and admission", icon: ListChecks },
]

function CenterViewTabs({ activeView, onChange, t, zh, isMobile }) {
  return (
    <div aria-label={zh ? "催化文献与反应记录中心视图" : "Catalysis literature and reaction record center views"} role="tablist" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, display: "grid", gap: 3, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", padding: 3 }}>
      {CENTER_VIEWS.map(view => {
        const Icon = view.icon
        const selected = activeView === view.id
        return (
          <button
            key={view.id}
            aria-controls={`catalysis-center-panel-${view.id}`}
            aria-selected={selected}
            id={`catalysis-center-tab-${view.id}`}
            onClick={() => onChange(view.id)}
            role="tab"
            type="button"
            style={{ alignItems: "center", background: selected ? t.panel : "transparent", border: selected ? `1px solid ${t.borderStrong}` : "1px solid transparent", borderRadius: 5, color: selected ? t.accentText : t.muted, cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6, justifyContent: "center", minHeight: 36, padding: "7px 10px" }}
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

  return (
    <section id="catalysis-literature-record-center" data-testid="catalysis-literature-record-center" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 14, padding: isMobile ? 12 : 16 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, minWidth: 0, maxWidth: 900 }}>
          <span style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}><Database aria-hidden size={15} weight="fill" />{zh ? "反应记录、来源与核验状态" : "Formal records and evidence admission"}</span>
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

      <div aria-labelledby="catalysis-center-tab-records" hidden={activeView !== "records"} id="catalysis-center-panel-records" role="tabpanel" style={{ minWidth: 0 }}>
        <CatalysisReactionRecordWorkbench dataset={recordDataset} embedded isMobile={isMobile} lang={lang} t={t} />
      </div>
      <div aria-labelledby="catalysis-center-tab-verification" hidden={activeView !== "verification"} id="catalysis-center-panel-verification" role="tabpanel" style={{ minWidth: 0 }}>
        <CatalysisVerificationCenter database={verificationDatabase} embedded graph={evidenceGraph} isMobile={isMobile} lang={lang} t={t} tasksDataset={verificationTasks} />
      </div>
    </section>
  )
}

export default CatalysisLiteratureRecordCenter
