// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  getCatalysisRecords,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { ModulePageHeader } from "../module/ModuleTop"
import { CollapsibleResearchSection } from "../common/CollapsibleResearchSection"
import { enrichCatalysisRecord } from "../catalysis/evidenceScoring"
import { OrganicAcidEntryCard } from "../catalysis/OrganicAcidEntryCard"
import { OrganicAcidFinalScreening } from "../catalysis/organic-acid-final/OrganicAcidFinalScreening"
import { OrganicAcidWorkspace } from "../catalysis/OrganicAcidWorkspace"
import { ReactionPathwayEvidenceMap } from "../catalysis/ReactionPathwayEvidenceMap"
import { SelectedPathwayInspector } from "../catalysis/SelectedPathwayInspector"

const DEFAULT_FILTERS = {
  pathwayCategory: "all",
  evidenceLevel: "all",
  productType: "all",
  comparabilityStatus: "all",
  validationStatus: "all",
}

const ORGANIC_ACID_WORKSPACE_HASHES = new Set([
  "catalysis-organic-acid",
  "organic-acid-workbench",
  "organic-acid-graph-explorer",
  "organic-acid-carbon-flow-graph",
  "algorithm-trace-explorer",
  "priority",
  "organic-acid-evidence-matrix",
  "validation",
])

const ORGANIC_ACID_FINAL_HASHES = new Set([
  "catalysis-organic-acid-final-screening",
  "organic-acid-research-validation",
  "organic-acid-evidence-coverage",
  "organic-acid-confidence-matrix",
  "organic-acid-priority-queue",
  "organic-acid-knowledge-graph",
  "organic-acid-final-decision-board",
])

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function LoadingPanel({ t, lang }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
      {lang === "zh" ? "正在加载催化路径数据..." : "Loading catalysis pathway data..."}
    </section>
  )
}

function BoundaryStrip({ t, lang }) {
  const zh = lang === "zh"
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 5, fontSize: 12.5, lineHeight: 1.5, padding: "11px 13px" }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
        {zh ? "数据状态：demo / seed / literature-derived" : "Data status: demo / seed / literature-derived"}
      </div>
      <div>
        {zh
          ? "页面用于证据整理、可比性检查和验证优先级判断；任何候选结果都需要实验验证。"
          : "This page supports evidence organization, comparability checks, and validation prioritization; candidate results still require experiments."}
      </div>
    </section>
  )
}

function workspaceFromHash() {
  if (typeof window === "undefined") return "overview"
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  if (ORGANIC_ACID_FINAL_HASHES.has(hash)) return "organic-acid-final"
  return ORGANIC_ACID_WORKSPACE_HASHES.has(hash) ? "organic-acid" : "overview"
}

function organicAcidScrollTargetFromHash() {
  if (typeof window === "undefined") return null
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  return ORGANIC_ACID_WORKSPACE_HASHES.has(hash) && hash !== "catalysis-organic-acid" ? hash : null
}

function organicAcidFinalScrollTargetFromHash() {
  if (typeof window === "undefined") return null
  const hash = String(window.location.hash || "").replace(/^#/, "").trim()
  return ORGANIC_ACID_FINAL_HASHES.has(hash) && hash !== "catalysis-organic-acid-final-screening" ? hash : null
}

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const zh = lang === "zh"
  const [rawRecords, setRawRecords] = useState([])
  const [status, setStatus] = useState("loading")
  const [activeWorkspace, setActiveWorkspace] = useState(workspaceFromHash)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [selectedPathwayId, setSelectedPathwayId] = useState(null)
  const [pendingOrganicScrollTarget, setPendingOrganicScrollTarget] = useState(null)
  const [pendingFinalScrollTarget, setPendingFinalScrollTarget] = useState(null)
  const workspaceRef = useRef(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    getCatalysisRecords({ throwOnError: true })
      .then((records) => {
        if (!active) return
        setRawRecords(safeArray(records))
        setStatus("loaded")
      })
      .catch(error => {
        if (!active) return
        console.warn("Catalysis Lab data could not be loaded.", error)
        setRawRecords([])
        setFingerprints([])
        setStatus("error")
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const syncWorkspace = () => {
      const nextWorkspace = workspaceFromHash()
      setActiveWorkspace(nextWorkspace)
      if (nextWorkspace === "organic-acid") setPendingOrganicScrollTarget(organicAcidScrollTargetFromHash())
      if (nextWorkspace === "organic-acid-final") setPendingFinalScrollTarget(organicAcidFinalScrollTargetFromHash())
    }
    syncWorkspace()
    window.addEventListener("hashchange", syncWorkspace)
    window.addEventListener("popstate", syncWorkspace)
    return () => {
      window.removeEventListener("hashchange", syncWorkspace)
      window.removeEventListener("popstate", syncWorkspace)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || activeWorkspace !== "organic-acid" || !pendingOrganicScrollTarget) return undefined
    const delays = [90, 260, 620, 1100, 1650]
    const timers = delays.map((delay, index) => window.setTimeout(() => {
      document.getElementById(pendingOrganicScrollTarget)?.scrollIntoView({
        behavior: index === 0 ? "smooth" : "auto",
        block: "start",
      })
      if (index === delays.length - 1) setPendingOrganicScrollTarget(null)
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [activeWorkspace, pendingOrganicScrollTarget])

  useEffect(() => {
    if (typeof window === "undefined" || activeWorkspace !== "organic-acid-final" || !pendingFinalScrollTarget) return undefined
    const delays = [120, 360, 800, 1400, 2200]
    const timers = delays.map((delay, index) => window.setTimeout(() => {
      document.getElementById(pendingFinalScrollTarget)?.scrollIntoView({
        behavior: index === 0 ? "smooth" : "auto",
        block: "start",
      })
      if (index === delays.length - 1) setPendingFinalScrollTarget(null)
    }, delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [activeWorkspace, pendingFinalScrollTarget])

  const catalysisRecords = useMemo(() => (
    rawRecords.map(record => enrichCatalysisRecord(record))
  ), [rawRecords])

  const filteredRecords = useMemo(() => catalysisRecords.filter(record => {
    const matchCategory = filters.pathwayCategory === "all" || record.pathwayCategory === filters.pathwayCategory
    const matchEvidence = filters.evidenceLevel === "all" || record.evidenceLevel === filters.evidenceLevel
    const matchProduct = filters.productType === "all" || record.productType === filters.productType || record.mainProduct === filters.productType
    const matchComparability = filters.comparabilityStatus === "all" || record.comparabilityStatus === filters.comparabilityStatus
    const matchValidation = filters.validationStatus === "all" || record.validationStatus === filters.validationStatus
    return matchCategory && matchEvidence && matchProduct && matchComparability && matchValidation
  }), [catalysisRecords, filters])

  useEffect(() => {
    if (selectedRecordId && !filteredRecords.some(record => record.id === selectedRecordId)) {
      setSelectedRecordId(null)
      setSelectedPathwayId(null)
    }
  }, [filteredRecords, selectedRecordId])

  const selectedRecord = useMemo(() => (
    selectedRecordId ? filteredRecords.find(record => record.id === selectedRecordId) || null : null
  ), [filteredRecords, selectedRecordId])

  const evidenceMix = useMemo(() => filteredRecords.reduce((acc, record) => {
    const key = record.evidenceLevel || "pending"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {}), [filteredRecords])

  const highestRisk = useMemo(() => filteredRecords.find(record => String(record.validationStatus || record.riskStatus || "").toLowerCase().includes("risk")) || filteredRecords.find(record => record.validationStatus !== "validated") || filteredRecords[0], [filteredRecords])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSelectedRecordId(null)
    setSelectedPathwayId(null)
  }

  const handleSelectRecord = (record) => {
    if (!record?.id) return
    setSelectedRecordId(record.id)
    setSelectedPathwayId(record.pathwayId || null)
    if (record.candidateId) setSelectedCandidateId(record.candidateId)
  }

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidateId(candidateId)
    const linkedRecord = catalysisRecords.find(record => record.candidateId === candidateId)
    if (linkedRecord) {
      setSelectedRecordId(linkedRecord.id)
      setSelectedPathwayId(linkedRecord.pathwayId || null)
    }
  }

  const openOrganicAcidWorkspace = () => {
    setActiveWorkspace("organic-acid")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis-organic-acid") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis-organic-acid`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const openOrganicAcidFinalScreening = () => {
    setActiveWorkspace("organic-acid-final")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis-organic-acid-final-screening") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis-organic-acid-final-screening`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const openOrganicAcidSection = (targetId) => {
    setPendingOrganicScrollTarget(targetId)
    openOrganicAcidWorkspace()
  }

  const backToOverview = () => {
    setActiveWorkspace("overview")
    if (typeof window !== "undefined" && window.location.hash !== "#catalysis") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#catalysis`)
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const workspaceShellStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    margin: "0 auto",
    maxWidth: 1280,
    overflow: "visible",
    padding: isMobile ? "0 2px" : 0,
    position: "relative",
  }

  if (activeWorkspace === "organic-acid") {
    return (
      <div ref={workspaceRef} style={workspaceShellStyle}>
        <OrganicAcidWorkspace lang={lang} t={t} isMobile={isMobile} onBack={backToOverview} />
      </div>
    )
  }

  if (activeWorkspace === "organic-acid-final") {
    return (
      <div ref={workspaceRef} style={workspaceShellStyle}>
        <OrganicAcidFinalScreening lang={lang} t={t} isMobile={isMobile} onBack={backToOverview} />
      </div>
    )
  }

  return (
    <div ref={workspaceRef} style={workspaceShellStyle}>
      <ModulePageHeader
        title={zh ? "催化实验室" : "Catalysis Lab"}
        subtitle={zh
          ? "查看催化路径证据、反应数据可比性，以及 CO₂ 转化等方向的早期验证优先级。"
          : "Explore catalyst-pathway evidence, reaction-data comparability, and early validation priorities for CO₂ conversion routes."}
        action={<CopyLinkButton hash="catalysis" ariaLabel={zh ? "复制催化实验室链接" : "Copy Catalysis Lab link"} />}
      />

      <BoundaryStrip t={t} lang={lang} />

      <section
        id="catalysis-research-overview"
        data-testid="catalysis-research-overview"
        style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 8, padding: 16 }}
      >
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Catalysis Research Overview</span>
        <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2, margin: 0 }}>{zh ? "催化研究总览" : "Catalysis Research Overview"}</h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>
          {zh
            ? "催化实验室聚焦有机酸路径研究：从有机酸项目入口、反应路径证据网络、候选优先级，到研究验证中心、证据矩阵、知识图谱与验证路线图，并链接到 Methods & Evidence。所有统计均由底层数据派生。"
            : "The Catalysis Lab focuses on organic-acid pathway research: organic-acid project entry, pathway evidence network, candidate prioritization, the research validation center, evidence matrix, knowledge graph, and validation roadmap, linked to Methods & Evidence. All statistics are derived from the underlying data."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Organic Acid Project Entry", "Pathway Evidence Network", "Candidate Prioritization", "Research Validation Center", "Evidence Matrix", "Knowledge Graph", "Validation Roadmap"].map(label => (
            <span key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, fontSize: 10.6, fontWeight: 700, padding: "3px 9px" }}>{label}</span>
          ))}
        </div>
      </section>

      {status === "loading" ? <LoadingPanel t={t} lang={lang} /> : null}
      {status === "error" ? (
        <section style={{ background: t.panel, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.warn, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
          {zh ? "催化路径数据暂时无法加载。" : "Catalysis pathway data could not be loaded."}
        </section>
      ) : null}

      {status === "loaded" ? (
        <>
          <OrganicAcidEntryCard
            t={t}
            lang={lang}
            isMobile={isMobile}
            onOpen={openOrganicAcidWorkspace}
          />

          <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 14 }}>
            <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
              <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
                <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
                  {zh ? "最终筛选闭环" : "Final screening loop"}
                </div>
                <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: 0 }}>
                  {zh ? "Organic Acid Final Screening" : "Organic Acid Final Screening"}
                </h2>
                <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0, maxWidth: 860 }}>
                  {zh
                    ? "独立展示 170°C 水相 CO₂ 到甲酸 / 有机酸的 Al-MOF 稳定骨架筛选、第二金属推荐、Why Mo 瀑布图、敏感性分析、盲测基线和 EXAFS 可证伪预测。"
                    : "Open the separate 170°C aqueous CO₂ to formic acid / organic acids workflow for Al-MOF scaffold mining, dopant recommendation, Why Mo waterfall, sensitivity analysis, blind baselines, and EXAFS falsification."}
                </p>
              </div>
              <button
                type="button"
                onClick={openOrganicAcidFinalScreening}
                style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 36, padding: "8px 12px" }}
              >
                {zh ? "进入最终筛选" : "Enter final screening"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["Stage 1: Al-MOF only", "Stage 2: dopant recommendation", "Mo as outcome", "needs validation"].map(label => <BasisBadge key={label} tone={label === "needs validation" ? "warn" : "proxy"}>{label}</BasisBadge>)}
            </div>
          </section>

          <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: "11px 13px" }}>
            <strong style={{ color: t.textStrong }}>
              {zh ? "有机酸子工作台边界：" : "Organic Acid workspace boundary: "}
            </strong>
            {zh
              ? "有机酸转化是 Catalysis Lab 中优先展示的子工作台，但不是催化模块的全部范围。"
              : "Organic acid conversion is a prioritized sub-workspace within Catalysis Lab, not the full scope of catalysis."}
          </section>

          <CollapsibleResearchSection
            id="catalysis-pathway-evidence-section"
            title="Catalytic Pathway Evidence Map"
            titleZh="催化路径证据图"
            description="Browse pathway evidence, comparability status, product direction, and validation gaps before entering detailed workspaces."
            descriptionZh="在进入详细工作台前，浏览路径证据、可比性状态、产物方向和验证缺口。"
            defaultState="expanded"
            statusBadges={[
              { label: zh ? "需要实验验证" : "Needs validation", tone: "warn" },
              { label: zh ? "演示 / 文献整理" : "demo / literature-derived", tone: "proxy" },
            ]}
            summaryItems={[
              { label: zh ? "路径数量" : "Pathways", value: filteredRecords.length },
              { label: zh ? "当前路径" : "Active pathway", value: selectedRecord?.pathwayName || selectedRecord?.pathwayId || (zh ? "未选择" : "none") },
              { label: zh ? "证据覆盖" : "Evidence coverage", value: Object.entries(evidenceMix).map(([key, count]) => `${key}:${count}`).join(" · ") || "pending" },
              { label: zh ? "最高风险路径" : "Highest risk pathway", value: highestRisk?.pathwayName || highestRisk?.pathwayId || "pending" },
            ]}
            miniPreview={
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                  {[0, 1, 2, 3].map(index => (
                    <span key={index} style={{ background: index === 1 ? t.accent : t.borderStrong, borderRadius: 999, height: 8 }} />
                  ))}
                </div>
                <div style={{ color: t.subtle, fontSize: 11 }}>{zh ? "简化路径线 · 点击展开查看筛选器、证据表和路径详情。" : "Mini pathway preview · expand to inspect filters, evidence table, and pathway details."}</div>
              </div>
            }
          >
            <ReactionPathwayEvidenceMap
              records={filteredRecords}
              allRecords={catalysisRecords}
              filters={filters}
              onFilterChange={updateFilter}
              selectedRecordId={selectedRecordId}
              onSelectRecord={handleSelectRecord}
              onClearFilters={clearFilters}
              t={t}
              lang={lang}
              isMobile={isMobile}
            />
          </CollapsibleResearchSection>

          <SelectedPathwayInspector record={selectedRecord} t={t} lang={lang} isMobile={isMobile} />
        </>
      ) : null}
    </div>
  )
}
