// @ts-nocheck
import { computePearsonCorrelation, computeStd } from "../../utils/criticScoring"
import { DEFAULT_CRITIC_OPTIONS, finiteNumberOrNull, normalizeWeightMap } from "../types/scoringTypes"

function rankValues(values = []) {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value)
  const ranks = Array(values.length).fill(0)
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1].value === sorted[i].value) j += 1
    const rank = (i + j + 2) / 2
    for (let k = i; k <= j; k += 1) ranks[sorted[k].index] = rank
    i = j + 1
  }
  return ranks
}

function correlation(a, b, method) {
  const pairs = a
    .map((value, index) => [Number(value), Number(b[index])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (pairs.length < 2) return null
  const xs = pairs.map(([x]) => x)
  const ys = pairs.map(([, y]) => y)
  if (method === "spearman") return computePearsonCorrelation(rankValues(xs), rankValues(ys))
  return computePearsonCorrelation(xs, ys)
}

function conflictFromCorrelation(r, mode) {
  if (!Number.isFinite(r)) return null
  const value = mode === "oneMinusR" ? 1 - r : 1 - Math.abs(r)
  return Math.max(0, value)
}

function descriptorValues(matrix, descriptor) {
  return (matrix || [])
    .filter(row => !row.missing?.[descriptor.key])
    .map(row => finiteNumberOrNull(row.values?.[descriptor.key]))
    .filter(value => value !== null)
}

export function computeCriticWeighting({
  matrix = [],
  descriptors = [],
  options = {},
} = {}) {
  const settings = { ...DEFAULT_CRITIC_OPTIONS, ...(options?.critic || {}), ...options }
  const warnings = []
  const keys = descriptors.map(descriptor => descriptor.key).filter(Boolean)
  if (!matrix.length || keys.length === 0) {
    return {
      weights: normalizeWeightMap({}, descriptors),
      diagnostics: {
        method: "critic",
        fallbackUsed: true,
        usedFallback: true,
        reason: !matrix.length ? "empty-candidate-matrix" : "empty-descriptor-set",
        validDescriptorCount: 0,
        droppedDescriptors: keys,
      },
      warnings: ["CRITIC weighting received no candidate matrix; equal weights were used."],
      explanation: "CRITIC could not be computed without candidates, so equal weights were used.",
    }
  }

  const valuesByKey = Object.fromEntries(descriptors.map(descriptor => [descriptor.key, descriptorValues(matrix, descriptor)]))
  const missingRateByDescriptor = Object.fromEntries(descriptors.map(descriptor => {
    const missingCount = matrix.filter(row => row.missing?.[descriptor.key]).length
    return [descriptor.key, matrix.length ? missingCount / matrix.length : 0]
  }))
  const validRatioByDescriptor = Object.fromEntries(descriptors.map(descriptor => {
    const valid = valuesByKey[descriptor.key]?.length || 0
    return [descriptor.key, matrix.length ? valid / matrix.length : 0]
  }))

  const lowValidity = descriptors.filter(descriptor => validRatioByDescriptor[descriptor.key] < settings.minValidRatio)
  if (lowValidity.length) {
    warnings.push(`Low valid-data ratio for ${lowValidity.map(item => item.key).join(", ")}; weights may be unstable.`)
  }

  const sigma = Object.fromEntries(descriptors.map(descriptor => [
    descriptor.key,
    computeStd(valuesByKey[descriptor.key] || []),
  ]))
  const minValidCount = Math.max(2, Math.ceil(matrix.length * settings.minValidRatio))
  const droppedDescriptors = descriptors
    .filter(descriptor => {
      const values = valuesByKey[descriptor.key] || []
      return values.length === 0 || values.length < minValidCount || (sigma[descriptor.key] || 0) <= 0
    })
    .map(descriptor => descriptor.key)
  const droppedSet = new Set(droppedDescriptors)
  const activeDescriptors = descriptors.filter(descriptor => !droppedSet.has(descriptor.key))
  if (droppedDescriptors.length) {
    warnings.push(`CRITIC skipped descriptors without enough contrast or valid values: ${droppedDescriptors.join(", ")}.`)
  }
  const correlationMatrix = Object.fromEntries(descriptors.map(rowDescriptor => [
    rowDescriptor.key,
    Object.fromEntries(descriptors.map(colDescriptor => {
      if (rowDescriptor.key === colDescriptor.key) return [colDescriptor.key, 1]
      if (droppedSet.has(rowDescriptor.key) || droppedSet.has(colDescriptor.key)) return [colDescriptor.key, 0]
      const comparableRows = matrix.filter(row => !row.missing?.[rowDescriptor.key] && !row.missing?.[colDescriptor.key])
      const a = comparableRows.map(row => row.values?.[rowDescriptor.key])
      const b = comparableRows.map(row => row.values?.[colDescriptor.key])
      const r = correlation(a, b, settings.correlationMethod)
      if (r === null) warnings.push(`Insufficient paired data for ${rowDescriptor.key} vs ${colDescriptor.key}; correlation treated as 0.`)
      return [colDescriptor.key, Number.isFinite(r) ? r : 0]
    })),
  ]))
  const conflictMatrix = Object.fromEntries(descriptors.map(rowDescriptor => [
    rowDescriptor.key,
    Object.fromEntries(descriptors.map(colDescriptor => {
      if (rowDescriptor.key === colDescriptor.key) return [colDescriptor.key, 0]
      const value = conflictFromCorrelation(correlationMatrix[rowDescriptor.key]?.[colDescriptor.key], settings.conflictMode)
      return [colDescriptor.key, Number.isFinite(value) ? value : 0]
    })),
  ]))
  const conflictScore = Object.fromEntries(descriptors.map(descriptor => [
    descriptor.key,
    droppedSet.has(descriptor.key)
      ? 0
      : activeDescriptors.reduce((sum, other) => sum + (conflictMatrix[descriptor.key]?.[other.key] || 0), 0),
  ]))
  const informationContent = Object.fromEntries(descriptors.map(descriptor => [
    descriptor.key,
    droppedSet.has(descriptor.key) ? 0 : (sigma[descriptor.key] || 0) * (conflictScore[descriptor.key] || 0),
  ]))
  const informationTotal = Object.values(informationContent).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
  let fallbackUsed = false
  let weights = normalizeWeightMap(informationContent, descriptors)
  let fallbackReason = ""
  if (matrix.length < 2) fallbackReason = "candidate-count-below-two"
  else if (!activeDescriptors.length) fallbackReason = "no-valid-descriptors"
  else if (!Number.isFinite(informationTotal) || informationTotal <= 0) fallbackReason = "zero-information-content"
  if (fallbackReason) {
    fallbackUsed = true
    weights = normalizeWeightMap({}, descriptors)
    warnings.push("CRITIC information content was zero or underspecified; equal weights were used.")
  }

  return {
    weights,
    diagnostics: {
      method: "critic",
      fallbackUsed,
      usedFallback: fallbackUsed,
      reason: fallbackReason || undefined,
      validDescriptorCount: activeDescriptors.length,
      droppedDescriptors,
      settings,
      sigma,
      contrastIntensity: sigma,
      correlationMatrix,
      conflictMatrix,
      conflictScore,
      informationContent,
      missingRateByDescriptor,
      validRatioByDescriptor,
    },
    warnings: Array.from(new Set(warnings)),
    explanation: "CRITIC estimates objective ranking influence from descriptor contrast and non-redundant information in the current candidate set.",
  }
}
