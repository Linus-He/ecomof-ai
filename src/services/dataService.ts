// @ts-nocheck
import { CORE_MOF_DESCRIPTOR_KEYS } from "../scoring/descriptors/descriptorRegistry"
import { DEFAULT_CANDIDATE_DATA_MODE } from "../config/dataModes"
import { normalizeMofCandidate } from "../utils/normalizeMofCandidate"
import {
  CsdMofRequestError,
  attachCsdPublicUrls,
  downloadCsdMofCif,
  getCsdMofPublicCatalog as loadCsdMofPublicCatalog,
  getCsdMofRecordDetails,
  preloadCsdMofStructures,
  scheduleCsdMofPreload,
} from "./csdMofPublicService"

const DATA_PROVIDER = import.meta.env.VITE_DATA_PROVIDER || "static"
const DEFAULT_CSD_MOF_PUBLIC_BASE = "https://linus-he.github.io/ecomof-csd-mof-data/"

const DATA_PATHS = {
  mofCandidatesDemo: "data/mof_candidates_demo.json",
  mofCandidatesRealSeed: "data/mof_candidates_real_seed.json",
  coreMof2024SearchIndex: "data/core_mof_2024/cr_search_index.json",
  mofNameAliases: "data/mof_name_aliases.json",
  organicAcidExperimentRecords: "data/organic_acid_experiment_records.json",
  catalysisTasks: "data/catalysis_tasks.json",
  catalysisRecords: "data/catalysis_records_demo.json",
  catalysisReactionRecordsV1: "data/catalysis_reaction_records_v1.json",
  catalysisReactionRecordsSchemaV1: "data/catalysis_reaction_records_schema_v1.json",
  catalysisReactionDatabaseV2: "data/catalysis_v2/catalysis_reaction_database_v2.json",
  catalysisReactionSchemaV2: "data/catalysis_reaction_records_schema_v2.json",
  catalysisVerificationTasksV2: "data/catalysis_v2/catalysis_verification_tasks_v2.json",
  catalysisEvidenceGraphV2: "data/catalysis_v2/catalysis_evidence_graph_v2.json",
  catalysisDiscoveryBatchesV1: "data/catalysis_v2/catalysis_discovery_batches_v1.json",
  catalysisCandidateQueueV1: "data/catalysis_v2/catalysis_candidate_queue_v1.json",
  catalysisExtractionSuggestionsV1: "data/catalysis_v2/catalysis_extraction_suggestions_v1.json",
  catalysisDiscoveryAuditV1: "data/catalysis_v2/catalysis_discovery_audit_v1.json",
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
  fairMofsImportV1: "data/data_ingestion/fair_mofs_import_v1.json",
  fairMofsFamilySynthesisEvidence: "data/fair_mofs_family_synthesis_evidence.json",
  fairMofsPropertyIndex: "data/fair_mofs_property_index_v1.json",
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

const staticJsonPromiseCache = new Map()

function loadStaticJson(path) {
  const url = dataUrl(path)
  if (!staticJsonPromiseCache.has(url)) {
    const request = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Data request failed: ${response.status}`)
        return response.json()
      })
      .catch(error => {
        staticJsonPromiseCache.delete(url)
        throw error
      })
    staticJsonPromiseCache.set(url, request)
  }
  return staticJsonPromiseCache.get(url)
}

export async function fetchJson(path, fallback = [], options = {}) {
  if (DATA_PROVIDER !== "static") {
    // Future adapters can branch here. The current prototype intentionally
    // remains static-only and does not request /api or external services.
  }

  try {
    return await loadStaticJson(path)
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

export {
  CsdMofRequestError,
  attachCsdPublicUrls,
  downloadCsdMofCif,
  getCsdMofRecordDetails,
  preloadCsdMofStructures,
  scheduleCsdMofPreload,
}

export async function getCsdMofPublicCatalog({ throwOnError = false } = {}) {
  return loadCsdMofPublicCatalog(CSD_MOF_PUBLIC_BASE, { throwOnError })
}

export function fetchDataJson(fileName, fallback = [], options = {}) {
  return fetchJson(`data/${String(fileName || "").replace(/^\/+/, "")}`, fallback, options)
}

export async function getMofCandidates({ mode = DEFAULT_CANDIDATE_DATA_MODE, throwOnError = false } = {}) {
  if (mode !== DEFAULT_CANDIDATE_DATA_MODE) {
    console.warn(`Ignoring legacy MOF candidate mode "${mode}"; using the real CoRE MOF 2024 CR index.`)
  }
  return fetchJson(DATA_PATHS.coreMof2024SearchIndex, [], { throwOnError })
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

export function getCatalysisReactionRecordsV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisReactionRecordsV1, { records: [], sources: [] }, { throwOnError })
}

export function getCatalysisReactionRecordsSchemaV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisReactionRecordsSchemaV1, {}, { throwOnError })
}

export function getCatalysisReactionDatabaseV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisReactionDatabaseV2, { summary: {}, tables: {} }, { throwOnError })
}

export function getCatalysisReactionSchemaV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisReactionSchemaV2, {}, { throwOnError })
}

export function getCatalysisVerificationTasksV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisVerificationTasksV2, { summary: {}, tasks: [] }, { throwOnError })
}

export function getCatalysisEvidenceGraphV2({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisEvidenceGraphV2, { summary: {}, nodes: [], edges: [] }, { throwOnError })
}

export function getCatalysisDiscoveryBatchesV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisDiscoveryBatchesV1, { summary: {}, families: [], batches: [] }, { throwOnError })
}

export function getCatalysisCandidateQueueV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisCandidateQueueV1, { summary: {}, families: [], candidates: [], navigationCandidates: [] }, { throwOnError })
}

export function getCatalysisExtractionSuggestionsV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisExtractionSuggestionsV1, { summary: {}, suggestions: [] }, { throwOnError })
}

export function getCatalysisDiscoveryAuditV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisDiscoveryAuditV1, { summary: {}, checks: [] }, { throwOnError })
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

export function getFairMofsImportV1({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.fairMofsImportV1, { records: [] }, { throwOnError })
}

export function getFairMofsFamilySynthesisEvidence({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.fairMofsFamilySynthesisEvidence, { families: [] }, { throwOnError })
}

export function getFairMofsPropertyIndex({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.fairMofsPropertyIndex, { records: [] }, { throwOnError })
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
