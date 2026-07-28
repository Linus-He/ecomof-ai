// @ts-nocheck
import { useEffect, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { Panel, StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { loadDatabaseIndexOverview } from "../../utils/databaseIndex/databaseIndexLoaders"
import { dbStatusLabel } from "../../utils/databaseIndex/databaseIndexCopy"
import { normalizeComparableCandidate } from "../../utils/databaseIndex/databaseIndexFormatters"
import { CandidateComparePanel } from "./CandidateComparePanel"
import { DatabaseIndexBoundaryNotice } from "./DatabaseIndexBoundaryNotice"
import { DatabaseIndexFilterToolbar } from "./DatabaseIndexFilterToolbar"
import { DatabaseIndexSkeleton } from "./DatabaseIndexSkeleton"
import { DatabaseIndexSummaryCards } from "./DatabaseIndexSummaryCards"
import { DatabaseManifestPanel } from "./DatabaseManifestPanel"
import { DatabaseDetailDrawer } from "./DatabaseDetailDrawer"
import { DescriptorAvailabilityPanel } from "./DescriptorAvailabilityPanel"
import { IndexPartBrowser } from "./IndexPartBrowser"
import { PrecomputedTopCandidatesPanel } from "./PrecomputedTopCandidatesPanel"
import { ProvenanceCoveragePanel } from "./ProvenanceCoveragePanel"

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

  if (status === "loading") return <DatabaseIndexSkeleton lang={lang} t={t} />

  return (
    <Panel
      id="organic-acid-database-index-workbench"
      eyebrow={text(lang, "CoRE MOF 2024 · 真实记录索引", "CoRE MOF 2024 · Real Record Index")}
      title={text(lang, "CoRE 2024 CR 数据库索引与结构审阅", "CoRE 2024 CR Database Index & Structural Review")}
      t={t}
      actions={<StatusPill tone={status === "error" ? "warn" : "proxy"} t={t}>{dbStatusLabel(status, lang)}</StatusPill>}
    >
      <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "基于 9,835 条真实 CoRE MOF 2024 CSD-modified CR 记录的全量轻量索引。页面按分片和按需详情审阅结构；结构审阅样本不是催化性能排名。",
          "A complete lightweight index of 9,835 real CoRE MOF 2024 CSD-modified CR records. Structure records load by part or on demand; the structural-review sample is not a catalytic-performance ranking."
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
          <IndexPartBrowser manifest={overview.manifest} filters={filters} onOpenDetail={setDetailRequest} onAddCompare={handleAddCompare} compareCount={compareItems.length} lang={lang} t={t} isMobile={isMobile} />
          <DatabaseDetailDrawer request={detailRequest} onClose={() => setDetailRequest(null)} lang={lang} t={t} />
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
