// @ts-nocheck
import { CORE_MOF_DESCRIPTOR_KEYS } from "../scoring/descriptors/descriptorRegistry"
import { DEFAULT_CANDIDATE_DATA_MODE } from "../config/dataModes"
import { normalizeMofCandidate } from "../utils/normalizeMofCandidate"

const DATA_PROVIDER = import.meta.env.VITE_DATA_PROVIDER || "static"
const DEFAULT_CSD_MOF_PUBLIC_BASE = "https://linus-he.github.io/ecomof-csd-mof-data/"

const DATA_PATHS = {
  mofCandidatesDemo: "data/mof_candidates_demo.json",
  mofCandidatesRealSeed: "data/mof_candidates_real_seed.json",
  openMofSeedCandidates: "data/open_mof_seed_candidates.json",
  mofNameAliases: "data/mof_name_aliases.json",
  organicAcidExperimentRecords: "data/organic_acid_experiment_records.json",
  catalysisTasks: "data/catalysis_tasks.json",
  catalysisRecords: "data/catalysis_records_demo.json",
  catalyticPathways: "data/catalytic_pathways_demo.json",
  pathwayNodes: "data/pathway_nodes_demo.json",
  reactionFingerprints: "data/reaction_fingerprint_demo.json",
  mofReactionScreeningTags: "data/mof_reaction_screening_tags.json",
  evidenceLevels: "data/evidence_levels.json",
  scoringWeights: "data/scoring_weights.json",
  references: "data/references.json",
  benchmarkReferences: "data/benchmark_references.json",
  mofStructures: "data/mof_structures.json",
  adsorptionLabels: "data/adsorption_labels.json",
  gasSeparationRecords: "data/mof_gas_separation_records.json",
  gasSystemsDemo: "data/gas_systems_demo.json",
  gasSourcesDemo: "data/gas_sources_demo.json",
  gasAdsorptionRecordsV1: "data/gas_adsorption_records_v1.json",
  gasAdsorptionRecordsV2: "data/gas_adsorption_records_v2.json",
  gasAdsorptionV2CollectionReport: "data/gas_adsorption_v2_collection_report.json",
  gasAdsorptionV21IastReport: "data/gas_adsorption_v2_1_iast_report.json",
  mofIdentityResolutionReport: "data/mof_identity_resolution_report.json",
  gasStructureProxyValidationReport: "data/gas_structure_proxy_validation_report.json",
  gasAdsorptionDuplicateReportV21: "data/gas_adsorption_duplicate_report_v2_1.json",
  mofIdentityRegistry: "data/mof_identity_registry.json",
  coreMofImportV2: "data/data_ingestion/core_mof_import_v2.json",
  qmofImportV2: "data/data_ingestion/qmof_import_v2.json",
  csdStructurePilotManifest: "data/csd_structure_pilot_manifest.json",
  gasAdsorptionSourcesV1: "data/gas_adsorption_sources_v1.json",
  gasAdsorptionFieldSourcesV1: "data/gas_adsorption_field_sources_v1.json",
  gasAdsorptionSchemaV1: "data/gas_adsorption_schema_v1.json",
  gasAdsorptionRecordsDemo: "data/gas_adsorption_records_demo.json",
  scalableDatabasePreviewV22: "data/database_precompute/v2_2/scalable_database_preview_records.json",
  mediumDatabasePreviewV21: "data/database_precompute/v2_1/medium_database_preview_records.json",
}

const QUALITY_FIELDS = CORE_MOF_DESCRIPTOR_KEYS

export { DATA_PROVIDER }

function externalBaseUrl(value) {
  const normalized = String(value || "").trim()
  return (normalized || DEFAULT_CSD_MOF_PUBLIC_BASE).replace(/\/?$/, "/")
}

export const CSD_MOF_PUBLIC_BASE = externalBaseUrl(import.meta.env.VITE_CSD_MOF_PUBLIC_BASE)

function dataUrl(path) {
  const base = import.meta.env.BASE_URL || "/"
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`
  return `${baseWithSlash}${String(path || "").replace(/^\/+/, "")}`
}

export async function fetchJson(path, fallback = [], options = {}) {
  if (DATA_PROVIDER !== "static") {
    // Future adapters can branch here. The current prototype intentionally
    // remains static-only and does not request /api or external services.
  }

  try {
    const response = await fetch(dataUrl(path))
    if (!response.ok) {
      const error = new Error(`Data request failed: ${response.status}`)
      if (options.throwOnError) throw error
      console.warn(error.message)
      return fallback
    }
    return await response.json()
  } catch (error) {
    if (options.throwOnError) throw error
    console.warn("Data could not be loaded from GitHub Pages.", error)
    return fallback
  }
}

export async function fetchExternalJson(url, fallback = [], options = {}) {
  try {
    const response = await fetch(url, { mode: "cors" })
    if (!response.ok) {
      const error = new Error(`External data request failed: ${response.status}`)
      if (options.throwOnError) throw error
      console.warn(error.message)
      return fallback
    }
    return await response.json()
  } catch (error) {
    if (options.throwOnError) throw error
    console.warn("External research data could not be loaded.", error)
    return fallback
  }
}

export function attachCsdPublicUrls(catalog, baseUrl = CSD_MOF_PUBLIC_BASE) {
  const normalizedBase = externalBaseUrl(baseUrl)
  const structures = Array.isArray(catalog?.structures)
    ? catalog.structures.map(record => ({
        ...record,
        cifUrl: new URL(String(record.path || "").replace(/^\/+/, ""), normalizedBase).href,
      }))
    : []
  return {
    ...(catalog || {}),
    publicBaseUrl: normalizedBase,
    structures,
  }
}

export async function getCsdMofPublicCatalog({ throwOnError = false } = {}) {
  const fallback = {
    schemaVersion: "1.0.0",
    dataset: {
      name: "CSD MOF Collection (Non-Commercial)",
      license: {
        spdx: "CC-BY-NC-SA-4.0",
        url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      },
    },
    summary: { total: 0 },
    structures: [],
  }
  const catalog = await fetchExternalJson(
    new URL("index/structures.json", CSD_MOF_PUBLIC_BASE).href,
    fallback,
    { throwOnError },
  )
  return attachCsdPublicUrls(catalog, CSD_MOF_PUBLIC_BASE)
}

export function fetchDataJson(fileName, fallback = [], options = {}) {
  return fetchJson(`data/${String(fileName || "").replace(/^\/+/, "")}`, fallback, options)
}

export async function getMofCandidates({ mode = DEFAULT_CANDIDATE_DATA_MODE, throwOnError = false } = {}) {
  if (mode !== DEFAULT_CANDIDATE_DATA_MODE) {
    console.warn(`Ignoring legacy MOF candidate mode "${mode}"; using Open MOF Seed as the single candidate route.`)
  }
  const scalablePreview = await fetchJson(DATA_PATHS.scalableDatabasePreviewV22, null, { throwOnError: false })
  if (Array.isArray(scalablePreview) && scalablePreview.length) return scalablePreview
  const mediumPreview = await fetchJson(DATA_PATHS.mediumDatabasePreviewV21, null, { throwOnError: false })
  if (Array.isArray(mediumPreview) && mediumPreview.length) return mediumPreview
  return fetchJson(DATA_PATHS.openMofSeedCandidates, [], { throwOnError })
}

export async function getIsolatedMofExampleCandidates({ dataset = "demo", throwOnError = false } = {}) {
  const path = dataset === "real-seed" ? DATA_PATHS.mofCandidatesRealSeed : DATA_PATHS.mofCandidatesDemo
  return fetchJson(path, [], { throwOnError })
}

export async function getGlobalMofCandidates(options = {}) {
  const mode = DEFAULT_CANDIDATE_DATA_MODE
  const [rows, aliasDictionary] = await Promise.all([
    getMofCandidates({ ...options, mode }),
    getMofNameAliases({ throwOnError: false }),
  ])
  return Array.isArray(rows) ? rows.map(row => normalizeMofCandidate(row, { mode, aliasDictionary })) : []
}

export function getMofNameAliases({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.mofNameAliases, [], { throwOnError })
}

export function getOrganicAcidExperimentRecords({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.organicAcidExperimentRecords, [], { throwOnError })
}

export function getCatalysisTasks({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisTasks, [], { throwOnError })
}

export function getCatalysisRecords({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisRecords, [], { throwOnError })
}

export function getCatalyticPathways({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalyticPathways, [], { throwOnError })
}

export function getPathwayNodes({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.pathwayNodes, [], { throwOnError })
}

export function getReactionFingerprints({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.reactionFingerprints, [], { throwOnError })
}

export function getMofReactionScreeningTags({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.mofReactionScreeningTags, [], { throwOnError })
}

export function getEvidenceLevels({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.evidenceLevels, [], { throwOnError })
}

export function getScoringWeights({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.scoringWeights, {}, { throwOnError })
}

export function getReferences({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.references, [], { throwOnError })
}

export function getBenchmarkReferences({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.benchmarkReferences, [], { throwOnError })
}

export function getMofStructures({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.mofStructures, [], { throwOnError })
}

export function getAdsorptionLabels({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.adsorptionLabels, [], { throwOnError })
}

export function getGasSeparationRecords({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasSeparationRecords, [], { throwOnError })
}

export function getGasSystemsDemo({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasSystemsDemo, [], { throwOnError })
}

export function getGasSourcesDemo({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasSourcesDemo, [], { throwOnError })
}

export function getGasAdsorptionRecordsV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionRecordsV1, [], { throwOnError })
}

export function getGasAdsorptionRecordsV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionRecordsV2, [], { throwOnError })
}

export function getGasAdsorptionV2CollectionReport({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionV2CollectionReport, {}, { throwOnError })
}

export function getGasAdsorptionV21IastReport({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionV21IastReport, {}, { throwOnError })
}

export function getMofIdentityResolutionReport({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.mofIdentityResolutionReport, {}, { throwOnError })
}

export function getGasStructureProxyValidationReport({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasStructureProxyValidationReport, {}, { throwOnError })
}

export function getGasAdsorptionDuplicateReportV21({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionDuplicateReportV21, {}, { throwOnError })
}

export function getMofIdentityRegistry({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.mofIdentityRegistry, { records: [], unresolved: [], summary: {} }, { throwOnError })
}

export function getCoreMofImportV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.coreMofImportV2, { records: [] }, { throwOnError })
}

export function getQmofImportV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.qmofImportV2, { records: [] }, { throwOnError })
}

export function getCsdStructurePilotManifest({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.csdStructurePilotManifest, { records: [], license: {} }, { throwOnError })
}

export function getGasAdsorptionSourcesV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionSourcesV1, [], { throwOnError })
}

export function getGasAdsorptionFieldSourcesV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionFieldSourcesV1, {}, { throwOnError })
}

export function getGasAdsorptionSchemaV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionSchemaV1, {}, { throwOnError })
}

export function getGasAdsorptionRecordsDemo({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.gasAdsorptionRecordsDemo, [], { throwOnError })
}

function hasCuratedSource(source) {
  if (!source) return false
  if (source.sourceType === "pending") return false
  if (source.evidenceLevel === "needs-validation") return false
  return true
}

export async function getDataQualitySummary() {
  const rows = await getGlobalMofCandidates({ mode: DEFAULT_CANDIDATE_DATA_MODE })
  if (!Array.isArray(rows) || rows.length === 0) {
    return { recordCount: 0, fieldCoverage: [], evidenceCounts: {} }
  }

  const evidenceCounts = rows.reduce((counts, row) => {
    const level = row.evidenceLevel || "pending"
    counts[level] = (counts[level] || 0) + 1
    return counts
  }, {})

  const fieldCoverage = QUALITY_FIELDS.map(key => {
    const curated = rows.filter(row => hasCuratedSource(row.fieldSources?.[key])).length
    return {
      key,
      curated,
      pending: rows.length - curated,
      percent: Math.round((curated / rows.length) * 100),
    }
  })

  return { recordCount: rows.length, fieldCoverage, evidenceCounts }
}
