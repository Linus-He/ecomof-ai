const DATA_PROVIDER = import.meta.env.VITE_DATA_PROVIDER || "static"

const DATA_PATHS = {
  mofCandidatesDemo: "data/mof_candidates_demo.json",
  mofCandidatesRealSeed: "data/mof_candidates_real_seed.json",
  catalysisTasks: "data/catalysis_tasks.json",
  evidenceLevels: "data/evidence_levels.json",
  scoringWeights: "data/scoring_weights.json",
  references: "data/references.json",
  benchmarkReferences: "data/benchmark_references.json",
  mofStructures: "data/mof_structures.json",
  adsorptionLabels: "data/adsorption_labels.json",
}

const QUALITY_FIELDS = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

export { DATA_PROVIDER }

function dataUrl(path) {
  const base = import.meta.env.BASE_URL || "/"
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`
  return `${baseWithSlash}${String(path || "").replace(/^\/+/, "")}`
}

export async function fetchJson(path, fallback = []) {
  if (DATA_PROVIDER !== "static") {
    // Future adapters can branch here. The current prototype intentionally
    // remains static-only and does not request /api or external services.
  }

  try {
    const response = await fetch(dataUrl(path))
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

export function fetchDataJson(fileName, fallback = []) {
  return fetchJson(`data/${String(fileName || "").replace(/^\/+/, "")}`, fallback)
}

export async function getMofCandidates({ mode = "demo" } = {}) {
  const path = mode === "real-seed" ? DATA_PATHS.mofCandidatesRealSeed : DATA_PATHS.mofCandidatesDemo
  return fetchJson(path, [])
}

export function getCatalysisTasks() {
  return fetchJson(DATA_PATHS.catalysisTasks, [])
}

export function getEvidenceLevels() {
  return fetchJson(DATA_PATHS.evidenceLevels, [])
}

export function getScoringWeights() {
  return fetchJson(DATA_PATHS.scoringWeights, {})
}

export function getReferences() {
  return fetchJson(DATA_PATHS.references, [])
}

export function getBenchmarkReferences() {
  return fetchJson(DATA_PATHS.benchmarkReferences, [])
}

export function getMofStructures() {
  return fetchJson(DATA_PATHS.mofStructures, [])
}

export function getAdsorptionLabels() {
  return fetchJson(DATA_PATHS.adsorptionLabels, [])
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
