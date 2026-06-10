// @ts-nocheck
import { useCallback, useEffect, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { Panel, StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { loadDatabaseIndexOverview } from "../../utils/databaseIndex/databaseIndexLoaders"
import { fetchJson } from "../../services/dataService"
import { dbStatusLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { normalizeComparableCandidate, normalizeTopCandidates } from "../../utils/databaseIndex/databaseIndexFormatters"
import { CandidateComparePanel } from "./CandidateComparePanel"
import { DatabaseIndexBoundaryNotice } from "./DatabaseIndexBoundaryNotice"
import { DatabaseIndexFilterToolbar } from "./DatabaseIndexFilterToolbar"
import { DatabaseIndexSkeleton } from "./DatabaseIndexSkeleton"
import { DatabaseIndexSummaryCards } from "./DatabaseIndexSummaryCards"
import { DatabaseManifestPanel } from "./DatabaseManifestPanel"
import { DatabaseDetailDrawer } from "./DatabaseDetailDrawer"
import { DescriptorAvailabilityPanel } from "./DescriptorAvailabilityPanel"
import { AlgorithmImprovementTracePanel } from "./AlgorithmImprovementTracePanel"
import { DescriptorRedundancyPanel } from "./DescriptorRedundancyPanel"
import { FeatureAblationAuditPanel } from "./FeatureAblationAuditPanel"
import { IndexPartBrowser } from "./IndexPartBrowser"
import { MetadataVerificationPanel } from "./MetadataVerificationPanel"
import { ManualMetadataCurationPanel } from "./ManualMetadataCurationPanel"
import { MetadataVerificationQueuePanel } from "./MetadataVerificationQueuePanel"
import { PrecomputedTopCandidatesPanel } from "./PrecomputedTopCandidatesPanel"
import { SensitivityAuditPanel } from "./SensitivityAuditPanel"
import { ProvenanceCoveragePanel } from "./ProvenanceCoveragePanel"
import { WorkerScoringBoundaryPreview } from "./WorkerScoringBoundaryPreview"

const DEFAULT_FILTERS = {
  sourceDatabase: "all",
  qualityStatus: "all",
  metal: "all",
  descriptors: [],
  provenanceCoverage: "all",
}

export function DatabaseIndexWorkbench({ lang, t, isMobile, onOverviewLoaded }) {
  const [status, setStatus] = useState("loading")
  const [overview, setOverview] = useState(null)
  const [detailRequest, setDetailRequest] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [compareItems, setCompareItems] = useState([])
  const [selectedPartSnapshot, setSelectedPartSnapshot] = useState({ records: [], filteredRecords: [], path: "" })
  const [curationRecords, setCurationRecords] = useState(null)

  useEffect(() => {
    let active = true
    // Lazy-load the small V2.0-I manual curation file (not the full database).
    fetchJson("data/database_precompute/v2_0_i/manual_metadata_curation.json", null)
      .then(payload => { if (active) setCurationRecords(Array.isArray(payload?.curation) ? payload.curation : []) })
      .catch(() => { if (active) setCurationRecords([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setStatus("loading")
    loadDatabaseIndexOverview().then(result => {
      if (!active) return
      setOverview(result)
      onOverviewLoaded?.(result)
      setStatus(result.errors?.length ? "warning" : "loaded")
    }).catch(error => {
      if (!active) return
      console.warn("Database index overview could not be loaded.", error)
      setOverview({ errors: [{ message: error?.message || "Database index overview failed to load." }] })
      setStatus("error")
    })
    return () => { active = false }
  }, [onOverviewLoaded])

  const handleAddCompare = candidate => {
    setCompareItems(items => {
      const normalized = normalizeComparableCandidate(candidate)
      if (items.some(item => item.id === normalized.id)) return items
      if (items.length >= 3) return items
      return [...items, normalized]
    })
  }

  const handleSelectedPartRecordsChange = useCallback(snapshot => {
    setSelectedPartSnapshot(snapshot || { records: [], filteredRecords: [], path: "" })
  }, [])

  if (status === "loading") return <DatabaseIndexSkeleton lang={lang} t={t} />

  return (
    <Panel
      id="organic-acid-database-index-workbench"
      eyebrow={text(lang, "V2.0-H · 小样本验证与敏感性审计", "V2.0-H · Small-Sample Validation and Sensitivity Audit")}
      title={text(lang, "Database Index Preview · 数据库索引预览", "Database Index Preview")}
      t={t}
      actions={<StatusPill tone={status === "error" ? "warn" : "proxy"} t={t}>{dbStatusLabel(status, lang)}</StatusPill>}
    >
      <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "面向大规模 CoRE/QMOF-like 数据接入的轻量索引摘要与按需详情预览。",
          "Lightweight index summaries and on-demand details for large-scale CoRE/QMOF-like database integration."
        )} />
      </p>
      <DatabaseIndexBoundaryNotice lang={lang} t={t} />
      {overview?.errors?.length ? (
        <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.45, padding: 10 }}>
          {overview.errors.map(error => <span key={`${error.path}-${error.message}`}>• <ChemicalText value={error.message || "Database index file load warning"} /></span>)}
        </section>
      ) : null}
      {overview?.manifest ? (
        <>
          <DatabaseManifestPanel manifest={overview.manifest} lang={lang} t={t} isMobile={isMobile} />
          <DatabaseIndexSummaryCards overview={overview} lang={lang} t={t} isMobile={isMobile} />
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <DescriptorAvailabilityPanel availability={overview.descriptorAvailability} lang={lang} t={t} />
            <ProvenanceCoveragePanel coverage={overview.provenanceCoverage} lang={lang} t={t} />
          </div>
          <DatabaseIndexFilterToolbar filters={filters} onChange={setFilters} lang={lang} t={t} />
          <PrecomputedTopCandidatesPanel topCandidates={overview.topCandidates} filters={filters} onOpenDetail={setDetailRequest} onAddCompare={handleAddCompare} compareCount={compareItems.length} lang={lang} t={t} />
          <CandidateComparePanel candidates={compareItems} onRemove={id => setCompareItems(items => items.filter(item => item.id !== id))} lang={lang} t={t} isMobile={isMobile} />
          <MetadataVerificationPanel topCandidates={normalizeTopCandidates(overview.topCandidates)} selectedPartRecords={selectedPartSnapshot.records} selectedCandidate={detailRequest || compareItems[0] || normalizeTopCandidates(overview.topCandidates)[0] || null} lang={lang} t={t} isMobile={isMobile} />
          <MetadataVerificationQueuePanel records={selectedPartSnapshot.records.length ? selectedPartSnapshot.records : normalizeTopCandidates(overview.topCandidates)} curationRecords={curationRecords} lang={lang} t={t} isMobile={isMobile} />
          <ManualMetadataCurationPanel curationRecords={curationRecords} lang={lang} t={t} isMobile={isMobile} />
          <DescriptorRedundancyPanel records={selectedPartSnapshot.records.length ? selectedPartSnapshot.records : normalizeTopCandidates(overview.topCandidates)} lang={lang} t={t} isMobile={isMobile} />
          <SensitivityAuditPanel records={selectedPartSnapshot.records.length ? selectedPartSnapshot.records : normalizeTopCandidates(overview.topCandidates)} lang={lang} t={t} isMobile={isMobile} />
          <FeatureAblationAuditPanel records={selectedPartSnapshot.records.length ? selectedPartSnapshot.records : normalizeTopCandidates(overview.topCandidates)} lang={lang} t={t} />
          <AlgorithmImprovementTracePanel records={selectedPartSnapshot.records.length ? selectedPartSnapshot.records : normalizeTopCandidates(overview.topCandidates)} topNCount={normalizeTopCandidates(overview.topCandidates).length} lang={lang} t={t} />
          <WorkerScoringBoundaryPreview topCandidates={normalizeTopCandidates(overview.topCandidates)} selectedPartRecords={selectedPartSnapshot.records} selectedCandidates={compareItems} lang={lang} t={t} isMobile={isMobile} />
          <IndexPartBrowser manifest={overview.manifest} filters={filters} onOpenDetail={setDetailRequest} onAddCompare={handleAddCompare} onSelectedPartRecordsChange={handleSelectedPartRecordsChange} compareCount={compareItems.length} lang={lang} t={t} isMobile={isMobile} />
          <DatabaseDetailDrawer request={detailRequest} curationRecords={curationRecords} onClose={() => setDetailRequest(null)} lang={lang} t={t} />
        </>
      ) : (
        <span style={{ color: t.warn, fontSize: 12, fontWeight: 850 }}>
          {text(lang, "数据库索引 manifest 暂时无法加载。", "Database index manifest could not be loaded.")}
        </span>
      )}
    </Panel>
  )
}

export default DatabaseIndexWorkbench
