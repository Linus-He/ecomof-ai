// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  getCatalysisRecords,
  getReactionFingerprints,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { ModulePageHeader } from "../module/ModuleTop"
import { CollapsibleResearchSection, SectionLayoutControls } from "../common/CollapsibleResearchSection"
import { DataHarmonizationWorkflow } from "../catalysis/DataHarmonizationWorkflow"
import { enrichCatalysisRecord } from "../catalysis/evidenceScoring"
import { CatalysisCatOverlayLayer } from "../catalysis/CatalysisCatOverlayLayer"
import { CatalysisEnergyBarrierDemo } from "../catalysis/CatalysisEnergyBarrierDemo"
import { OrganicAcidEntryCard } from "../catalysis/OrganicAcidEntryCard"
import { OrganicAcidFinalScreening } from "../catalysis/organic-acid-final/OrganicAcidFinalScreening"
import { OrganicAcidWorkspace } from "../catalysis/OrganicAcidWorkspace"
import { ReactionPathwayEvidenceMap } from "../catalysis/ReactionPathwayEvidenceMap"
import { SelectedPathwayInspector } from "../catalysis/SelectedPathwayInspector"
import { ValidationRoadmap } from "../catalysis/ValidationRoadmap"

const DEFAULT_FILTERS = {
  pathwayCategory: "all",
  evidenceLevel: "all",
  productType: "all",
  comparabilityStatus: "all",
  validationStatus: "all",
}

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
  if (hash === "catalysis-organic-acid-final-screening") return "organic-acid-final"
  return hash === "catalysis-organic-acid" || hash === "organic-acid-graph-explorer" ? "organic-acid" : "overview"
}

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const zh = lang === "zh"
  const [rawRecords, setRawRecords] = useState([])
  const [fingerprints, setFingerprints] = useState([])
  const [status, setStatus] = useState("loading")
  const [activeWorkspace, setActiveWorkspace] = useState(workspaceFromHash)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [selectedPathwayId, setSelectedPathwayId] = useState(null)
  const [pendingOrganicScrollTarget, setPendingOrganicScrollTarget] = useState(null)
  const [layoutCommand, setLayoutCommand] = useState(null)
  const workspaceRef = useRef(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getCatalysisRecords({ throwOnError: true }),
      getReactionFingerprints({ throwOnError: true }),
    ])
      .then(([records, fingerprintRows]) => {
        if (!active) return
        setRawRecords(safeArray(records))
        setFingerprints(safeArray(fingerprintRows))
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
    const syncWorkspace = () => setActiveWorkspace(workspaceFromHash())
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
        <CatalysisCatOverlayLayer workspaceRef={workspaceRef} lang={lang} t={t} isMobile={isMobile} />
      </div>
    )
  }

  if (activeWorkspace === "organic-acid-final") {
    return (
      <div ref={workspaceRef} style={workspaceShellStyle}>
        <OrganicAcidFinalScreening lang={lang} t={t} isMobile={isMobile} onBack={backToOverview} />
        <CatalysisCatOverlayLayer workspaceRef={workspaceRef} lang={lang} t={t} isMobile={isMobile} />
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

      <SectionLayoutControls command={setLayoutCommand} t={t} lang={lang} />

      <CatalysisEnergyBarrierDemo
        t={t}
        lang={lang}
        isMobile={isMobile}
        onNavigateToSection={openOrganicAcidSection}
      />

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
            layoutCommand={layoutCommand}
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

          <CollapsibleResearchSection
            id="catalysis-harmonization-section"
            title="Mechanism / Descriptor Interpretation"
            titleZh="机理 / 描述符解释"
            description="Shows how reaction fingerprints, MOF modulation factors, evidence state, and comparability checks enter the decision workflow."
            descriptionZh="展示反应指纹、MOF 调控因素、证据状态和可比性检查如何进入决策工作流。"
            defaultState="compact"
            lowPriority
            layoutCommand={layoutCommand}
            statusBadges={[
              { label: zh ? "证据状态" : "Evidence status", tone: "info" },
              { label: zh ? "推断数据" : "Inferred", tone: "proxy" },
            ]}
            summaryItems={[
              { label: zh ? "反应指纹" : "Fingerprints", value: fingerprints.length },
              { label: zh ? "候选记录" : "Records", value: catalysisRecords.length },
              { label: zh ? "调控因素" : "MOF factors", value: "descriptor / condition / evidence" },
            ]}
            miniPreview={
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["fingerprint", "MOF factor", "evidence", "validation"].map(label => <BasisBadge key={label} tone="proxy">{label}</BasisBadge>)}
              </div>
            }
          >
            <DataHarmonizationWorkflow lang={lang} t={t} isMobile={isMobile} />
          </CollapsibleResearchSection>

          <CollapsibleResearchSection
            id="catalysis-validation-roadmap-section"
            title="Validation Roadmap"
            titleZh="验证路线"
            description="Keeps candidate claims tied to the next experiment, required data, and expected evidence upgrade."
            descriptionZh="将候选结论绑定到下一步实验、所需数据和预期证据升级。"
            defaultState="compact"
            layoutCommand={layoutCommand}
            statusBadges={[
              { label: zh ? "验证优先级" : "Validation priority", tone: "warn" },
              { label: zh ? "不是最终结论" : "not final conclusion", tone: "proxy" },
            ]}
            summaryItems={[
              { label: zh ? "高优先级验证" : "High priority", value: highestRisk ? 1 : 0 },
              { label: zh ? "下一步实验" : "Next experiment", value: zh ? "同条件验证" : "same-condition validation" },
              { label: zh ? "预期影响" : "Expected impact", value: zh ? "升级证据等级" : "evidence upgrade" },
            ]}
            miniPreview={
              <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.45, padding: 10 }}>
                {zh ? "下一步：优先补齐同条件证据、碳平衡和稳定性验证。" : "Next: prioritize same-condition evidence, carbon balance, and stability validation."}
              </div>
            }
          >
            <ValidationRoadmap t={t} lang={lang} isMobile={isMobile} />
          </CollapsibleResearchSection>
        </>
      ) : null}
      <CatalysisCatOverlayLayer workspaceRef={workspaceRef} lang={lang} t={t} isMobile={isMobile} />
    </div>
  )
}
