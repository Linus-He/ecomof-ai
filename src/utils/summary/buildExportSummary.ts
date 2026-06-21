// @ts-nocheck
// V3.9 export summary — lists which datasets/snapshots can be exported, their
// availability, record counts, data mode, and whether provenance is attached.
// Drives the Export controls and the Project Status export row.
import { getSourcesByParticipation } from "../../data/registry/dataSourceRegistry"
import { safeNumber } from "../fallback/safeNumber"

export const EXPORT_TARGETS = [
  { id: "mof-library-csv", label: "MOF Library (current filter) CSV", format: "csv", sourceId: "open-mof-seed" },
  { id: "global-database-json", label: "Global Database Summary JSON", format: "json", sourceId: null },
  { id: "project-status-json", label: "Project Status Summary JSON", format: "json", sourceId: null },
  { id: "research-report-md", label: "Research Reports Snapshot JSON/Markdown", format: "json", sourceId: null },
  { id: "gassep-csv", label: "GasSep filtered records CSV", format: "csv", sourceId: "gas-adsorption" },
  { id: "organic-acid-queue-csv", label: "Organic Acid Priority Queue CSV", format: "csv", sourceId: "oa-priority" },
  { id: "knowledge-graph-json", label: "Knowledge Graph JSON", format: "json", sourceId: "oa-graph" },
  { id: "benchmark-eligibility-json", label: "Benchmark Eligibility Summary CSV/JSON", format: "json", sourceId: "benchmark-eligible" },
]

export function buildExportSummary({ globalSummary = null, generatedAt = "", dataVersion = "V3.9" } = {}) {
  const ts = generatedAt || new Date().toISOString()
  const sourceById = new Map((globalSummary?.sources || []).map((s: any) => [s.id, s]))

  const targets = EXPORT_TARGETS.map(target => {
    const src = target.sourceId ? sourceById.get(target.sourceId) : null
    const available = target.sourceId ? Boolean(src?.loaded) || Boolean(src) : Boolean(globalSummary)
    return {
      id: target.id,
      label: target.label,
      format: target.format,
      available,
      recordCount: src ? safeNumber(src.recordCount, 0) : null,
      dataMode: src?.dataMode || globalSummary?.dataMode || "mixed",
      provenanceIncluded: src ? Boolean(src.hasProvenance) : true,
    }
  })

  return {
    summaryId: "export-summary-v1",
    generatedAt: ts,
    dataVersion,
    dataMode: globalSummary?.dataMode || "mixed",
    exportableCount: targets.filter(t => t.available).length,
    reportSnapshotAvailable: Boolean(globalSummary),
    provenanceSourceCount: getSourcesByParticipation("export").length,
    targets,
  }
}

export default buildExportSummary
