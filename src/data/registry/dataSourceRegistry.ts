// @ts-nocheck
// V3.10.1 data registry — the single catalog of every data source that drives the
// dashboards. It answers: which sources exist, their type, their honesty mode
// (demo/seed/curated/inferred/experimental/literature/simulation), whether they
// carry provenance, and which surfaces they feed. Live record counts are layered
// on at runtime via `enrichRegistry`, so no card hardcodes a database number.
import type { DataSourceEntry } from "./datasetTypes"
import { DATA_MODES, DATASET_TYPES } from "./datasetTypes"

export const DATA_SOURCE_REGISTRY: DataSourceEntry[] = [
  // --- MOF records ---
  { id: "open-mof-seed", name: "Open MOF Seed", category: "MOF", datasetType: "mof_records", dataMode: "seed", path: "data/open_mof_seed_candidates.json", recordKey: "", hasProvenance: true, participatesIn: ["home", "projectStatus", "researchReports", "mofLibrary", "benchmark", "export"], updatedAt: "2026-05-20" },
  { id: "mof-real-seed", name: "Curated MOF sample", category: "MOF", datasetType: "mof_records", dataMode: "curated", path: "data/mof_candidates_real_seed.json", recordKey: "", hasProvenance: true, participatesIn: ["home", "projectStatus", "mofLibrary", "export"], updatedAt: "2026-05-20" },
  { id: "core-mof", name: "CoRE MOF 2019 (curated subset)", category: "MOF", datasetType: "mof_records", dataMode: "curated", path: "data/data_ingestion/core_mof_import_v2.json", recordKey: "records", hasProvenance: true, participatesIn: ["projectStatus", "researchReports", "benchmark"], updatedAt: "2026-06-18" },
  { id: "qmof", name: "QMOF (curated subset)", category: "MOF", datasetType: "mof_records", dataMode: "curated", path: "data/data_ingestion/qmof_import_v2.json", recordKey: "records", hasProvenance: true, participatesIn: ["projectStatus", "researchReports", "benchmark"], updatedAt: "2026-06-18" },
  { id: "mof-aliases", name: "MOF name aliases", category: "MOF", datasetType: "provenance_records", dataMode: "curated", path: "data/mof_name_aliases.json", recordKey: "", hasProvenance: true, participatesIn: ["mofLibrary"], updatedAt: "2026-05-21" },

  // --- Gas separation records ---
  { id: "gas-adsorption", name: "Gas adsorption records", category: "GasSep", datasetType: "gas_separation_records", dataMode: "mixed", path: "data/gas_adsorption_records_v1.json", recordKey: "records", hasProvenance: true, participatesIn: ["home", "projectStatus", "researchReports", "gasSep", "export"], updatedAt: "2026-06-01" },
  { id: "gas-adsorption-v2", name: "Gas adsorption records v2", category: "GasSep", datasetType: "gas_separation_records", dataMode: "mixed", path: "data/gas_adsorption_records_v2.json", recordKey: "records", hasProvenance: true, participatesIn: ["projectStatus", "researchReports", "gasSep", "mofLibrary", "export"], updatedAt: "2026-06-29" },
  { id: "mof-identity-registry", name: "MOF identity registry", category: "Database", datasetType: "identity_registry", dataMode: "mixed", path: "data/mof_identity_registry.json", recordKey: "records", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "researchReports"], updatedAt: "2026-06-29" },
  { id: "gas-adsorption-v2-report", name: "Gas adsorption v2 collection report", category: "GasSep", datasetType: "provenance_records", dataMode: "mixed", path: "data/gas_adsorption_v2_collection_report.json", recordKey: "summary", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "projectStatus"], updatedAt: "2026-06-29" },
  { id: "gas-adsorption-v2-1-iast-report", name: "Gas adsorption v2.1 IAST report", category: "GasSep", datasetType: "provenance_records", dataMode: "simulation", path: "data/gas_adsorption_v2_1_iast_report.json", recordKey: "computed", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "projectStatus", "researchReports", "export"], updatedAt: "2026-06-29" },
  { id: "mof-identity-resolution-report", name: "MOF identity resolution report", category: "Database", datasetType: "provenance_records", dataMode: "mixed", path: "data/mof_identity_resolution_report.json", recordKey: "unresolved", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "projectStatus", "researchReports", "export"], updatedAt: "2026-06-29" },
  { id: "gas-structure-proxy-validation-report", name: "Gas structure proxy validation", category: "GasSep", datasetType: "research_report_records", dataMode: "inferred", path: "data/gas_structure_proxy_validation_report.json", recordKey: "reviewedPairs", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "projectStatus", "researchReports", "export"], updatedAt: "2026-06-29" },
  { id: "gas-adsorption-duplicate-report-v2-1", name: "Gas adsorption v2.1 duplicate audit", category: "GasSep", datasetType: "provenance_records", dataMode: "mixed", path: "data/gas_adsorption_duplicate_report_v2_1.json", recordKey: "conditionRepeatGroups", hasProvenance: true, participatesIn: ["gasSep", "mofLibrary", "projectStatus", "researchReports"], updatedAt: "2026-06-29" },
  { id: "gas-field-sources", name: "Gas adsorption field provenance", category: "GasSep", datasetType: "provenance_records", dataMode: "curated", path: "data/gas_adsorption_field_sources_v1.json", recordKey: "records", hasProvenance: true, participatesIn: ["gasSep", "researchReports"], updatedAt: "2026-06-01" },
  { id: "gas-sources", name: "Gas adsorption sources", category: "GasSep", datasetType: "gas_separation_records", dataMode: "literature", path: "data/gas_adsorption_sources_v1.json", recordKey: "sources", hasProvenance: true, participatesIn: ["gasSep"], updatedAt: "2026-06-01" },

  // --- Organic acid records ---
  { id: "oa-pathways", name: "Organic acid pathways", category: "OrganicAcid", datasetType: "organic_acid_records", dataMode: "curated", path: "data/organic_acid_pathways.json", recordKey: "", hasProvenance: true, participatesIn: ["projectStatus", "organicAcid"], updatedAt: "2026-05-28" },
  { id: "oa-graph", name: "Organic acid knowledge graph", category: "OrganicAcid", datasetType: "organic_acid_records", dataMode: "curated", path: "data/organic_acid_pathway_graph.json", recordKey: "nodes", hasProvenance: true, participatesIn: ["organicAcid"], updatedAt: "2026-05-28" },
  { id: "oa-evidence", name: "Organic acid evidence items", category: "OrganicAcid", datasetType: "organic_acid_records", dataMode: "literature", path: "data/organic_acid_evidence_items.json", recordKey: "", hasProvenance: true, participatesIn: ["organicAcid", "researchReports"], updatedAt: "2026-05-21" },
  { id: "oa-priority", name: "Organic acid priority matrix", category: "OrganicAcid", datasetType: "organic_acid_records", dataMode: "inferred", path: "data/organic_acid_priority_matrix.json", recordKey: "", hasProvenance: false, participatesIn: ["organicAcid"], updatedAt: "2026-05-28" },

  // --- Benchmark records ---
  { id: "experimental-labels", name: "Experimental labels", category: "Benchmark", datasetType: "benchmark_records", dataMode: "experimental", path: "data/experimental_labels/experimental_labels_v2.json", recordKey: "labels", hasProvenance: true, participatesIn: ["home", "projectStatus", "researchReports", "benchmark", "export"], updatedAt: "2026-06-19" },
  { id: "external-test", name: "External test set", category: "Benchmark", datasetType: "benchmark_records", dataMode: "experimental", path: "data/external_test_dataset_v2.json", recordKey: "records", hasProvenance: true, participatesIn: ["projectStatus", "benchmark"], updatedAt: "2026-06-19" },
  { id: "benchmark-eligible", name: "Benchmark-eligible dataset", category: "Benchmark", datasetType: "benchmark_records", dataMode: "curated", path: "data/benchmark_dataset_v3_6.json", recordKey: "records", hasProvenance: true, participatesIn: ["projectStatus", "researchReports", "benchmark", "export"], updatedAt: "2026-06-19" },

  // --- Version records ---
  { id: "version-evolution", name: "Version evolution records", category: "Version", datasetType: "version_records", dataMode: "curated", path: "data/version_evolution_records.json", recordKey: "versions", hasProvenance: false, participatesIn: ["home", "projectStatus"], updatedAt: "2026-06-29" },
  { id: "version-docs", name: "Version docs", category: "Version", datasetType: "version_records", dataMode: "curated", path: "data/organic_acid_final_screening/version_docs.json", recordKey: "versions", hasProvenance: false, participatesIn: ["projectStatus"], updatedAt: "2026-06-21" },
  { id: "home-summary", name: "Home summary", category: "Version", datasetType: "version_records", dataMode: "curated", path: "data/home_summary.json", recordKey: "", hasProvenance: false, participatesIn: ["home"], updatedAt: "2026-06-29" },

  // --- Research report records ---
  { id: "ingestion-summary", name: "Data ingestion summary", category: "Research", datasetType: "research_report_records", dataMode: "mixed", path: "data/data_ingestion/data_ingestion_summary_v3.json", recordKey: "", hasProvenance: false, participatesIn: ["home", "projectStatus", "researchReports"], updatedAt: "2026-06-18" },
  { id: "source-registry", name: "Source registry", category: "Research", datasetType: "provenance_records", dataMode: "curated", path: "data/data_ingestion/source_registry.json", recordKey: "sources", hasProvenance: true, participatesIn: ["projectStatus", "researchReports", "export"], updatedAt: "2026-06-17" },
]

export function getSourcesByCategory(category: string): DataSourceEntry[] {
  return DATA_SOURCE_REGISTRY.filter(s => s.category === category)
}
export function getSourcesByType(datasetType: string): DataSourceEntry[] {
  return DATA_SOURCE_REGISTRY.filter(s => s.datasetType === datasetType)
}
export function getSourcesByParticipation(surface: string): DataSourceEntry[] {
  return DATA_SOURCE_REGISTRY.filter(s => s.participatesIn.includes(surface as any))
}

// Counts records inside a loaded dataset using the entry's recordKey.
export function countRecords(dataset: any, recordKey = ""): number {
  if (dataset == null) return 0
  if (Array.isArray(dataset)) return dataset.length
  if (recordKey && Array.isArray(dataset?.[recordKey])) return dataset[recordKey].length
  if (Array.isArray(dataset?.records)) return dataset.records.length
  if (Array.isArray(dataset?.labels)) return dataset.labels.length
  if (Number.isFinite(dataset?.total)) return dataset.total
  if (Number.isFinite(dataset?.count)) return dataset.count
  return 0
}

// Layers live record counts onto the static catalog. `loaded` maps source id ->
// fetched JSON. Missing sources resolve to recordCount 0 with a fallback flag.
export function enrichRegistry(loaded: Record<string, any> = {}): Array<DataSourceEntry & { recordCount: number; loaded: boolean }> {
  return DATA_SOURCE_REGISTRY.map(entry => {
    const dataset = loaded[entry.id]
    const isLoaded = dataset != null
    return { ...entry, recordCount: isLoaded ? countRecords(dataset, entry.recordKey) : 0, loaded: isLoaded }
  })
}

// A compact registry-level summary used by the global database summary.
export function summarizeRegistry(loaded: Record<string, any> = {}) {
  const enriched = enrichRegistry(loaded)
  const byCategory: Record<string, number> = {}
  const byMode: Record<string, number> = {}
  const byType: Record<string, number> = {}
  let totalRecords = 0
  let provenanceSources = 0
  for (const s of enriched) {
    byCategory[s.category] = (byCategory[s.category] || 0) + s.recordCount
    byMode[s.dataMode] = (byMode[s.dataMode] || 0) + 1
    byType[s.datasetType] = (byType[s.datasetType] || 0) + 1
    totalRecords += s.recordCount
    if (s.hasProvenance) provenanceSources += 1
  }
  const modes = Array.from(new Set(enriched.map(s => s.dataMode)))
  return {
    sourceCount: enriched.length,
    loadedCount: enriched.filter(s => s.loaded).length,
    totalRecords,
    provenanceSources,
    provenanceShare: enriched.length ? Number((provenanceSources / enriched.length).toFixed(3)) : 0,
    byCategory,
    byMode,
    byType,
    dataMode: modes.length > 1 ? "mixed" : modes[0] || "mixed",
    datasetTypes: DATASET_TYPES,
    dataModes: DATA_MODES,
    sources: enriched,
  }
}

export default DATA_SOURCE_REGISTRY
