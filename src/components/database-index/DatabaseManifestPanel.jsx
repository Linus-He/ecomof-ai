// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { MiniMetric, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount, normalizeIndexParts } from "../../utils/databaseIndex/databaseIndexFormatters"
import { getDatabaseIndexBasePath } from "../../utils/databaseIndex/databaseIndexClient"
import { DatabaseIndexStatusBadge } from "./DatabaseIndexStatusBadge"

export function DatabaseManifestPanel({ manifest = {}, lang, t, isMobile }) {
  const sourceDatabases = manifest.sourceDatabases || []
  const indexParts = normalizeIndexParts(manifest)
  const detailBasePaths = manifest.detailBasePaths || {}
  const recordCount = sourceDatabases.reduce((sum, row) => sum + Number(row.recordCount || 0), 0)
  const detailCount = sourceDatabases.reduce((sum, row) => sum + Number(row.detailCount || 0), 0)

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "Manifest 概览", "Manifest Panel")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <DatabaseIndexStatusBadge status={manifest.datasetMode || "database_index_preview"} t={t} />
          <DatabaseIndexStatusBadge status="offline_preprocessed" t={t} />
        </div>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(145px, 1fr))" }}>
        <MiniMetric label="version" value={displayValue(manifest.version)} t={t} />
        <MiniMetric label="datasetMode" value={displayValue(manifest.datasetMode)} t={t} />
        <MiniMetric label="buildDate" value={displayValue(manifest.buildDate)} t={t} />
        <MiniMetric label={text(lang, "记录数", "recordCount")} value={formatCount(recordCount)} t={t} />
        <MiniMetric label={text(lang, "详情数", "detailCount")} value={formatCount(detailCount)} t={t} />
        <MiniMetric label="index parts" value={formatCount(indexParts.length)} t={t} />
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <article style={{ display: "grid", gap: 6 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>sourceDatabases</span>
          {sourceDatabases.map(row => (
            <div key={row.name} style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, display: "grid", fontSize: 12, gap: 3, paddingTop: 6 }}>
              <strong style={{ color: t.textStrong }}><ChemicalText value={displayValue(row.name)} /></strong>
              <span>{formatCount(row.recordCount)} records · {formatCount(row.detailCount)} details · DOI/citation/license pending</span>
            </div>
          ))}
        </article>
        <article style={{ display: "grid", gap: 6 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>detail base paths</span>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}>{getDatabaseIndexBasePath()}</span>
          {Object.entries(detailBasePaths).map(([key, value]) => (
            <span key={key} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>{key}: {displayValue(value)}</span>
          ))}
        </article>
      </div>
      {(manifest.warnings || []).length ? (
        <div style={{ color: t.warn, display: "grid", fontSize: 12, fontWeight: 850, gap: 4, lineHeight: 1.45 }}>
          {manifest.warnings.map(item => <span key={item}>• <ChemicalText value={item} /></span>)}
        </div>
      ) : null}
    </section>
  )
}
