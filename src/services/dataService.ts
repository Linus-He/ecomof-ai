// @ts-nocheck
import { CORE_MOF_DESCRIPTOR_KEYS } from "../scoring/descriptors/descriptorRegistry"
import { DEFAULT_CANDIDATE_DATA_MODE } from "../config/dataModes"
import { normalizeMofCandidate } from "../utils/normalizeMofCandidate"

const DATA_PROVIDER = import.meta.env.VITE_DATA_PROVIDER || "static"

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
  gasAdsorptionRecordsDemo: "data/gas_adsorption_records_demo.json",
}

const QUALITY_FIELDS = CORE_MOF_DESCRIPTOR_KEYS

export { DATA_PROVIDER }

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

export function fetchDataJson(fileName, fallback = [], options = {}) {
  return fetchJson(`data/${String(fileName || "").replace(/^\/+/, "")}`, fallback, options)
}

export async function getMofCandidates({ mode = DEFAULT_CANDIDATE_DATA_MODE, throwOnError = false } = {}) {
  if (mode !== DEFAULT_CANDIDATE_DATA_MODE) {
    console.warn(`Ignoring legacy MOF candidate mode "${mode}"; using Open MOF Seed as the single candidate route.`)
  }
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
