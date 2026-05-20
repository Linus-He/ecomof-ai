import { CORE_MOF_DESCRIPTOR_KEYS } from "../scoring/descriptors/descriptorRegistry"

const DATA_PROVIDER = import.meta.env.VITE_DATA_PROVIDER || "static"

const DATA_PATHS = {
  mofCandidatesDemo: "data/mof_candidates_demo.json",
  mofCandidatesRealSeed: "data/mof_candidates_real_seed.json",
  coreMofSeedCandidates: "data/core_mof_seed_candidates.json",
  catalysisTasks: "data/catalysis_tasks.json",
  catalysisRecords: "data/catalysis_records_demo.json",
  evidenceLevels: "data/evidence_levels.json",
  scoringWeights: "data/scoring_weights.json",
  references: "data/references.json",
  benchmarkReferences: "data/benchmark_references.json",
  mofStructures: "data/mof_structures.json",
  adsorptionLabels: "data/adsorption_labels.json",
  gasSeparationRecords: "data/mof_gas_separation_records.json",
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

export async function getMofCandidates({ mode = "demo", throwOnError = false } = {}) {
  const path = mode === "core-seed"
    ? DATA_PATHS.coreMofSeedCandidates
    : mode === "real-seed"
      ? DATA_PATHS.mofCandidatesRealSeed
      : DATA_PATHS.mofCandidatesDemo
  return fetchJson(path, [], { throwOnError })
}

export function getCatalysisTasks({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisTasks, [], { throwOnError })
}

export function getCatalysisRecords({ throwOnError = false } = {}) {
  return fetchJson(DATA_PATHS.catalysisRecords, [], { throwOnError })
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

function hasCuratedSource(source) {
  if (!source) return false
  if (source.sourceType === "pending") return false
  if (source.evidenceLevel === "needs-validation") return false
  return true
}

export async function getDataQualitySummary() {
  const rows = await getMofCandidates({ mode: "real-seed" })
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
