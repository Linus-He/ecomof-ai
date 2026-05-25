import { useEffect, useMemo, useState } from "react"
import {
  CopyLinkButton,
  getCatalysisRecords,
  getReactionFingerprints,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { ModulePageHeader } from "../module/ModuleTop"
import { DataHarmonizationWorkflow } from "../catalysis/DataHarmonizationWorkflow"
import { enrichCatalysisRecord } from "../catalysis/evidenceScoring"
import { OrganicAcidDecisionPanel } from "../catalysis/OrganicAcidDecisionPanel"
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

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const zh = lang === "zh"
  const [rawRecords, setRawRecords] = useState([])
  const [fingerprints, setFingerprints] = useState([])
  const [status, setStatus] = useState("loading")
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [selectedPathwayId, setSelectedPathwayId] = useState(null)

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "0 auto", maxWidth: 1280, padding: isMobile ? "0 2px" : 0 }}>
      <ModulePageHeader
        title={zh ? "催化实验室" : "Catalysis Lab"}
        subtitle={zh
          ? "查看催化路径证据、反应数据可比性，以及 CO2 转化等方向的早期验证优先级。"
          : "Explore catalyst-pathway evidence, reaction-data comparability, and early validation priorities for CO2 conversion routes."}
        action={<CopyLinkButton hash="catalysis" ariaLabel={zh ? "复制催化实验室链接" : "Copy Catalysis Lab link"} />}
      />

      <BoundaryStrip t={t} lang={lang} />

      {status === "loading" ? <LoadingPanel t={t} lang={lang} /> : null}
      {status === "error" ? (
        <section style={{ background: t.panel, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.warn, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
          {zh ? "催化路径数据暂时无法加载。" : "Catalysis pathway data could not be loaded."}
        </section>
      ) : null}

      {status === "loaded" ? (
        <>
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

          <SelectedPathwayInspector record={selectedRecord} t={t} lang={lang} isMobile={isMobile} />

          <DataHarmonizationWorkflow lang={lang} t={t} isMobile={isMobile} />

          <OrganicAcidDecisionPanel
            records={catalysisRecords}
            fingerprints={fingerprints}
            selectedCandidateId={selectedCandidateId}
            selectedPathwayId={selectedPathwayId}
            onSelectCandidate={handleSelectCandidate}
            t={t}
            lang={lang}
            isMobile={isMobile}
          />

          <ValidationRoadmap t={t} lang={lang} isMobile={isMobile} />
        </>
      ) : null}
    </div>
  )
}
