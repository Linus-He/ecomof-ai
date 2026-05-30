// @ts-nocheck
export const WEIGHTING_ALGORITHMS = ["manual", "equal", "critic", "hybrid"]

export const MISSING_VALUE_STRATEGIES = ["penalize", "median", "zeroPenalty", "exclude", "ignore", "impute"]

export const DESCRIPTOR_DIRECTIONS = {
  BENEFIT: "benefit",
  COST: "cost",
}

export const DEFAULT_CRITIC_OPTIONS = {
  correlationMethod: "pearson",
  conflictMode: "oneMinusAbsR",
  normalization: "minmax",
  missingValueStrategy: "median",
  minValidRatio: 0.45,
  fallback: "equalWeights",
}

export const DEFAULT_SCORING_OPTIONS = {
  algorithm: "hybrid",
  hybridAlpha: 0.65,
  missingValueStrategy: "penalize",
  evidenceMode: "descriptor-evidence",
}

export const DEFAULT_MISSING_DESCRIPTOR_POLICY = {
  mode: "penalize",
  penaltyStrength: 0.25,
}

export function toPercent(value, digits = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "0%"
  return `${(number * 100).toFixed(digits)}%`
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function finiteNumberOrNull(value) {
  if (value === undefined || value === null) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || ["unknown", "not reported", "pending", "n/a", "na", "—", "null", "undefined", "nan", "infinity", "-infinity"].includes(trimmed.toLowerCase())) {
      return null
    }
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function clamp01(value, fallback = 0) {
  const number = safeNumber(value, fallback)
  return Math.max(0, Math.min(1, number))
}

export function normalizeWeightMap(weights = {}, descriptors = []) {
  const keys = descriptors.map(descriptor => descriptor.key || descriptor).filter(Boolean)
  const entries = keys.map(key => [key, Math.max(0, safeNumber(weights?.[key], 0))])
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const fallback = keys.length ? 1 / keys.length : 0
  return Object.fromEntries(entries.map(([key, value]) => [key, total > 0 ? value / total : fallback]))
}

export function normalizeCompletenessStatus(status, value) {
  const normalized = String(status || "").trim().toLowerCase()
  if (["curated", "pending", "missing", "needs-review", "demo"].includes(normalized)) return normalized
  if (value === undefined || value === null || value === "") return "missing"
  if (finiteNumberOrNull(value) !== null || typeof value === "boolean") return "curated"
  const text = String(value).trim().toLowerCase()
  if (["unknown", "not reported", "pending", "n/a", "na", "—"].includes(text)) return "missing"
  return "curated"
}
