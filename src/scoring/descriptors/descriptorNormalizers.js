import { isMissingScore } from "../../utils/criticScoring"
import { clamp01, safeNumber } from "../types/scoringTypes"
import { getCandidateDescriptorValue } from "./descriptorAccessors"
import { resolveDescriptorDefinitions } from "./descriptorDefinitions"
import { normalizeDescriptorDirections } from "./descriptorDirections"

const STRING_ALIASES = {
  "very low": "low",
  "low-medium": "medium",
  "medium-high": "high",
  pending: "unknown",
  "needs-validation": "unknown",
  "not reported": "unknown",
  "n/a": "unknown",
  na: "unknown",
}

function quantile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] === undefined) return sorted[base]
  return sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

function median(values) {
  return quantile(values, 0.5)
}

function normalizeLevel(value, levels = {}) {
  if (isMissingScore(value)) return null
  const key = STRING_ALIASES[String(value).trim().toLowerCase()] || String(value).trim().toLowerCase()
  if (Object.prototype.hasOwnProperty.call(levels, key)) {
    const mapped = levels[key]
    return Number.isFinite(Number(mapped)) ? Number(mapped) : null
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function readRawValue(candidate, descriptor) {
  const valueRecord = getCandidateDescriptorValue(candidate, descriptor)
  const value = valueRecord.value
  if (descriptor.valueType === "ordinal") return normalizeLevel(value, descriptor.levels)
  if (descriptor.valueType === "boolean") return value === true || String(value).toLowerCase() === "true" ? 1 : value === false || String(value).toLowerCase() === "false" ? 0 : null
  if (valueRecord.missing) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function getBounds(values, descriptor, normalization = "minmax") {
  const numeric = values.filter(Number.isFinite)
  if (!numeric.length) return descriptor.defaultRange || [0, 1]
  const candidateMin = normalization === "robustMinmax" ? quantile(numeric, 0.05) : Math.min(...numeric)
  const candidateMax = normalization === "robustMinmax" ? quantile(numeric, 0.95) : Math.max(...numeric)
  const [fallbackMin, fallbackMax] = descriptor.defaultRange || [0, 1]
  const min = Number.isFinite(candidateMin) ? candidateMin : fallbackMin
  const max = Number.isFinite(candidateMax) ? candidateMax : fallbackMax
  if (max === min) return [fallbackMin, fallbackMax === fallbackMin ? fallbackMin + 1 : fallbackMax]
  return [min, max]
}

function normalizeRaw(rawValue, bounds, direction) {
  if (!Number.isFinite(rawValue)) return null
  const [min, max] = bounds
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0.5
  const normalized = clamp01((rawValue - min) / (max - min), 0.5)
  return direction === "cost" ? clamp01(1 - normalized) : normalized
}

function fillMissing(value, fillValue, strategy, descriptor = {}) {
  if (Number.isFinite(value)) return clamp01(value)
  if (descriptor.missingPolicy === "penalize") return 0
  if (strategy === "zeroPenalty") return 0
  if (strategy === "exclude") return Number.isFinite(fillValue) ? clamp01(fillValue) : 0.5
  return Number.isFinite(fillValue) ? clamp01(fillValue) : 0.5
}

export function normalizeDescriptorMatrix({
  candidates = [],
  descriptors = [],
  descriptorDirections = {},
  presetDirections = {},
  normalization = "minmax",
  missingValueStrategy = "median",
} = {}) {
  const resolvedDescriptors = resolveDescriptorDefinitions(descriptors)
  const directions = normalizeDescriptorDirections(resolvedDescriptors, presetDirections, descriptorDirections)
  const rows = Array.isArray(candidates) ? candidates : []
  const rawByDescriptor = Object.fromEntries(resolvedDescriptors.map(descriptor => [
    descriptor.key,
    rows.map(candidate => readRawValue(candidate, descriptor)),
  ]))
  const boundsByDescriptor = Object.fromEntries(resolvedDescriptors.map(descriptor => [
    descriptor.key,
    getBounds(rawByDescriptor[descriptor.key] || [], descriptor, normalization),
  ]))
  const normalizedRawByDescriptor = Object.fromEntries(resolvedDescriptors.map(descriptor => [
    descriptor.key,
    (rawByDescriptor[descriptor.key] || []).map(value => normalizeRaw(value, boundsByDescriptor[descriptor.key], directions[descriptor.key])),
  ]))
  const fillByDescriptor = Object.fromEntries(resolvedDescriptors.map(descriptor => {
    const values = (normalizedRawByDescriptor[descriptor.key] || []).filter(Number.isFinite)
    return [descriptor.key, values.length ? median(values) : 0.5]
  }))

  const matrix = rows.map((candidate, rowIndex) => {
    const values = {}
    const rawValues = {}
    const missing = {}
    resolvedDescriptors.forEach(descriptor => {
      const raw = rawByDescriptor[descriptor.key]?.[rowIndex] ?? null
      const normalized = normalizedRawByDescriptor[descriptor.key]?.[rowIndex] ?? null
      rawValues[descriptor.key] = raw
      missing[descriptor.key] = !Number.isFinite(raw)
      values[descriptor.key] = fillMissing(normalized, fillByDescriptor[descriptor.key], missingValueStrategy, descriptor)
    })
    return {
      id: candidate?.id || candidate?.name || `candidate-${rowIndex + 1}`,
      candidate,
      values,
      rawValues,
      missing,
    }
  })

  const totalCells = rows.length * resolvedDescriptors.length
  const missingCells = matrix.reduce((sum, row) => (
    sum + resolvedDescriptors.filter(descriptor => row.missing[descriptor.key]).length
  ), 0)
  const missingRateByDescriptor = Object.fromEntries(resolvedDescriptors.map(descriptor => {
    const missingCount = matrix.filter(row => row.missing[descriptor.key]).length
    return [descriptor.key, rows.length ? missingCount / rows.length : 0]
  }))
  const validRecordCount = matrix.filter(row => resolvedDescriptors.some(descriptor => !row.missing[descriptor.key])).length
  const warnings = []
  if (!rows.length) warnings.push("No candidates were provided; the scoring engine returned an empty model.")
  if (missingCells > 0) warnings.push(`${missingCells}/${totalCells || 0} descriptor cells are missing and were handled by ${missingValueStrategy}.`)
  if (rows.length > 0 && rows.length < 4) warnings.push("Small candidate set: CRITIC weights and ranking stability may be sensitive to individual records.")
  resolvedDescriptors.filter(descriptor => descriptor.planned).forEach(descriptor => {
    warnings.push(`${descriptor.key} is registered as a planned descriptor; current results should not imply that production data are available.`)
  })

  return {
    descriptors: resolvedDescriptors,
    directions,
    matrix,
    boundsByDescriptor,
    fillByDescriptor,
    missingRate: totalCells ? missingCells / totalCells : 0,
    missingRateByDescriptor,
    validRecordCount,
    warnings,
  }
}
