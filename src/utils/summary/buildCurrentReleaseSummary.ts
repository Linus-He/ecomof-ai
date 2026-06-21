// @ts-nocheck
// V3.9 current release summary — the data behind the Home "Current Release Card".
// Pulls only the current version's entry from version_evolution_records (never
// the full changelog) and exposes friendly, fallback-safe fields.
import { normalizeMissingValue } from "../fallback/normalizeMissingValue"

export function buildCurrentReleaseSummary({ versionEvolution = {}, generatedAt = "" } = {}) {
  const ts = generatedAt || new Date().toISOString()
  const versions = Array.isArray(versionEvolution?.versions) ? versionEvolution.versions : []
  const currentVersion = versionEvolution?.currentVersion || versions[versions.length - 1]?.version || "unknown"
  const entry = versions.find((v: any) => v.version === currentVersion) || versions[versions.length - 1] || {}

  return {
    summaryId: "current-release-summary-v1",
    generatedAt: ts,
    version: currentVersion,
    date: entry.date || "unknown",
    summary: normalizeMissingValue(entry.summary, "generic"),
    scientificImpact: normalizeMissingValue(entry.scientificImpact, "generic"),
    validationImpact: normalizeMissingValue(entry.validationImpact, "generic"),
    knownLimitations: normalizeMissingValue(entry.knownLimitations, "generic"),
    categories: Array.isArray(entry.categories) ? entry.categories : [],
    nextVersionGoal: normalizeMissingValue(entry.nextVersionGoal, "generic"),
  }
}

export default buildCurrentReleaseSummary
