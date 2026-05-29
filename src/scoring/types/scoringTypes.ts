// @ts-nocheck
export const WEIGHTING_ALGORITHMS = ["manual", "equal", "critic", "hybrid"]

export const MISSING_VALUE_STRATEGIES = ["median", "zeroPenalty", "exclude"]

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
  missingValueStrategy: "median",
  evidenceMode: "descriptor-evidence",
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
