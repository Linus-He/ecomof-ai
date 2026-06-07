// @ts-nocheck
import { useEffect, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { Panel, StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { loadDatabaseIndexOverview } from "../../utils/databaseIndex/databaseIndexLoaders"
import { DatabaseIndexBoundaryNotice } from "./DatabaseIndexBoundaryNotice"
import { DatabaseIndexSkeleton } from "./DatabaseIndexSkeleton"
import { DatabaseIndexSummaryCards } from "./DatabaseIndexSummaryCards"
import { DatabaseManifestPanel } from "./DatabaseManifestPanel"
import { DatabaseDetailDrawer } from "./DatabaseDetailDrawer"
import { DescriptorAvailabilityPanel } from "./DescriptorAvailabilityPanel"
import { IndexPartBrowser } from "./IndexPartBrowser"
import { PrecomputedTopCandidatesPanel } from "./PrecomputedTopCandidatesPanel"
import { ProvenanceCoveragePanel } from "./ProvenanceCoveragePanel"

export function DatabaseIndexWorkbench({ lang, t, isMobile, onOverviewLoaded }) {
  const [status, setStatus] = useState("loading")
  const [overview, setOverview] = useState(null)
  const [detailRequest, setDetailRequest] = useState(null)

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

  if (status === "loading") return <DatabaseIndexSkeleton lang={lang} t={t} />

  return (
    <Panel
      id="organic-acid-database-index-workbench"
      eyebrow="V2.0-B · Database Index Workbench"
      title={text(lang, "Database Index Preview · 数据库索引预览", "Database Index Preview")}
      t={t}
      actions={<StatusPill tone={status === "error" ? "warn" : "proxy"} t={t}>{status}</StatusPill>}
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
          <PrecomputedTopCandidatesPanel topCandidates={overview.topCandidates} onOpenDetail={setDetailRequest} lang={lang} t={t} />
          <IndexPartBrowser manifest={overview.manifest} onOpenDetail={setDetailRequest} lang={lang} t={t} isMobile={isMobile} />
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
