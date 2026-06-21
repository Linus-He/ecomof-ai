// @ts-nocheck
// V3.9 global database summary — the single derived view of "the whole database".
// Aggregates the data-source registry (live counts) into category/mode/type
// breakdowns + provenance coverage, stamped with generatedAt / dataVersion /
// dataMode. Every database-scale card on the site should read from here instead
// of hardcoding numbers.
import { summarizeRegistry } from "../../data/registry/dataSourceRegistry"
import { safeNumber } from "../fallback/safeNumber"

export function buildGlobalDatabaseSummary({ loaded = {}, dataVersion = "V3.9", generatedAt = "" } = {}) {
  const registry = summarizeRegistry(loaded)
  const ts = generatedAt || new Date().toISOString()

  const categories = Object.entries(registry.byCategory).map(([category, records]) => ({
    category,
    records: safeNumber(records, 0),
    sources: registry.sources.filter(s => s.category === category).length,
  })).sort((a, b) => b.records - a.records)

  return {
    summaryId: "global-database-summary-v1",
    generatedAt: ts,
    dataVersion,
    dataMode: registry.dataMode,
    totalSources: registry.sourceCount,
    loadedSources: registry.loadedCount,
    totalRecords: registry.totalRecords,
    provenanceSources: registry.provenanceSources,
    provenanceShare: registry.provenanceShare,
    categories,
    byMode: registry.byMode,
    byType: registry.byType,
    sources: registry.sources.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      datasetType: s.datasetType,
      dataMode: s.dataMode,
      recordCount: safeNumber(s.recordCount, 0),
      loaded: Boolean(s.loaded),
      hasProvenance: Boolean(s.hasProvenance),
      participatesIn: Array.isArray(s.participatesIn) ? s.participatesIn : [],
      updatedAt: s.updatedAt || "unknown",
    })),
    fallbackApplied: registry.loadedCount < registry.sourceCount,
  }
}

export default buildGlobalDatabaseSummary
