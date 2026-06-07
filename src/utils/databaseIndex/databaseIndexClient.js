// @ts-nocheck

const DATABASE_INDEX_ROOT = "data/database_index/"

function baseUrl() {
  const base = import.meta.env.BASE_URL || "/"
  return base.endsWith("/") ? base : `${base}/`
}

export function getDatabaseIndexBasePath() {
  return `${baseUrl()}${DATABASE_INDEX_ROOT}`
}

function normalizeIndexPath(path = "") {
  const normalized = String(path || "").replace(/^\/+/, "")
  if (!normalized || normalized.includes("..") || /^https?:\/\//i.test(normalized)) {
    throw new Error(`Invalid database index path: ${path || "empty path"}`)
  }
  return normalized
}

export function getDatabaseIndexUrl(path = "") {
  return `${getDatabaseIndexBasePath()}${normalizeIndexPath(path)}`
}

function friendlyError(error, path, status = null) {
  const statusText = status ? `HTTP ${status}` : "load error"
  return {
    message: `Could not load database index file "${path}" (${statusText}).`,
    detail: error?.message || String(error || "Unknown error"),
    path,
    status,
  }
}

export async function fetchDatabaseIndexJson(path, fallback = null) {
  const safePath = normalizeIndexPath(path)
  try {
    const response = await fetch(getDatabaseIndexUrl(safePath))
    if (!response.ok) {
      return { data: fallback, error: friendlyError(null, safePath, response.status), path: safePath }
    }
    try {
      return { data: await response.json(), error: null, path: safePath }
    } catch (error) {
      return { data: fallback, error: friendlyError(error, safePath, response.status), path: safePath }
    }
  } catch (error) {
    return { data: fallback, error: friendlyError(error, safePath), path: safePath }
  }
}

export function fetchDatabaseManifest() {
  return fetchDatabaseIndexJson("manifest.json", null)
}

export function fetchDatabaseSummaryFile(fileName) {
  return fetchDatabaseIndexJson(fileName, null)
}

export function fetchIndexPart(partPath) {
  return fetchDatabaseIndexJson(partPath, { records: [] })
}

export function fetchDetailRecord(detailRef) {
  return fetchDatabaseIndexJson(detailRef, null)
}

export function fetchPrecomputedTopCandidates() {
  return fetchDatabaseSummaryFile("organic_acid_precomputed_top_candidates.json")
}

export function fetchDescriptorAvailability() {
  return fetchDatabaseSummaryFile("organic_acid_descriptor_availability.json")
}

export function fetchProvenanceCoverage() {
  return fetchDatabaseSummaryFile("provenance_coverage_summary.json")
}
