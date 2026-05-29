// @ts-nocheck
export const evidenceLevelScoreMap = {
  validated: 1,
  experimental: 1,
  literature: 0.8,
  "literature-supported": 0.8,
  real_seed: 0.75,
  dft: 0.72,
  derived: 0.6,
  "rule-based": 0.5,
  prototype: 0.45,
  demo: 0.4,
  validation_pending: 0.35,
  "needs-validation": 0.3,
  hypothesis: 0.2,
  pending: 0.15,
  unknown: 0.1,
}

export const comparabilityScoreMap = {
  comparable: 1,
  partially_comparable: 0.6,
  not_directly_comparable: 0.25,
  unknown: 0.1,
}

export const requiredCatalysisFields = [
  "catalyst",
  "pathwayId",
  "pathwayName",
  "mainProduct",
  "temperatureC",
  "pressureBar",
  "reactionTimeH",
  "conversion",
  "selectivity",
  "yield",
  "carbonEfficiency",
  "evidenceLevel",
  "sourceType",
  "comparabilityStatus",
  "validationStatus",
]

export const performanceFields = [
  "conversion",
  "selectivity",
  "yield",
  "carbonEfficiency",
  "co2UtilizationPotential",
]

export function isPresent(value) {
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  return true
}

export function normalizeMetric(value, min = 0, max = 1) {
  if (!isPresent(value)) return null
  const numeric = Number(value)
  if (max === min) return 0.5
  return Math.min(1, Math.max(0, (numeric - min) / (max - min)))
}

export function weightedAverageAvailable(metrics) {
  const available = metrics.filter(item => item.value !== null && item.value !== undefined && !Number.isNaN(Number(item.value)))
  const totalWeight = available.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  if (!available.length || totalWeight === 0) return null
  return available.reduce((sum, item) => sum + Number(item.value) * Number(item.weight || 0), 0) / totalWeight
}

export function mapEvidenceLevel(level) {
  return evidenceLevelScoreMap[String(level || "unknown")] ?? evidenceLevelScoreMap.unknown
}

export function mapComparability(status) {
  return comparabilityScoreMap[String(status || "unknown")] ?? comparabilityScoreMap.unknown
}

export function computeCompleteness(record, fields) {
  const available = fields.filter(field => isPresent(record?.[field]))
  return {
    score: fields.length ? available.length / fields.length : 0,
    available: available.length,
    total: fields.length,
    missing: fields.filter(field => !available.includes(field)),
  }
}

export function computeConditionCompleteness(record) {
  return computeCompleteness(record, ["temperatureC", "pressureBar", "reactionTimeH", "solvent"]).score
}

export function computeMetricCompleteness(record) {
  return computeCompleteness(record, ["conversion", "selectivity", "yield", "carbonEfficiency"]).score
}

export function computePerformancePotential(record) {
  const conversion = normalizeMetric(record?.conversion)
  const selectivity = normalizeMetric(record?.selectivity)
  const reportedYield = normalizeMetric(record?.yield)
  const inferredYield = reportedYield ?? (
    conversion !== null && selectivity !== null ? conversion * selectivity : null
  )
  return weightedAverageAvailable([
    { key: "yield", value: inferredYield, weight: 0.35 },
    { key: "selectivity", value: selectivity, weight: 0.25 },
    { key: "conversion", value: conversion, weight: 0.2 },
    { key: "carbonEfficiency", value: normalizeMetric(record?.carbonEfficiency), weight: 0.2 },
  ])
}

export function computeEvidenceReadiness(record) {
  return weightedAverageAvailable([
    { key: "evidenceLevel", value: mapEvidenceLevel(record?.evidenceLevel), weight: 0.3 },
    { key: "conditionCompleteness", value: computeConditionCompleteness(record), weight: 0.25 },
    { key: "metricCompleteness", value: computeMetricCompleteness(record), weight: 0.25 },
    { key: "comparability", value: mapComparability(record?.comparabilityStatus), weight: 0.2 },
  ])
}

export function computeDataCoverage(record) {
  return computeCompleteness(record, requiredCatalysisFields)
}

export function computePerformanceCoverage(record) {
  return computeCompleteness(record, performanceFields)
}

export function formatScore(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a"
  return Number(value).toFixed(digits)
}

export function pct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a"
  return `${Math.round(Math.max(0, Math.min(1, Number(value))) * 100)}%`
}

export function enrichCatalysisRecord(record = {}) {
  const dataCoverage = computeDataCoverage(record)
  const performanceCoverage = computePerformanceCoverage(record)
  const explicitMissing = Array.isArray(record.missingFields) ? record.missingFields : []
  const missingFields = Array.from(new Set([...dataCoverage.missing, ...performanceCoverage.missing, ...explicitMissing]))
  const performancePotential = computePerformancePotential(record)
  const evidenceReadiness = computeEvidenceReadiness(record)
  return {
    ...record,
    id: record.id || record.recordId,
    performancePotential,
    performanceCoverage: performanceCoverage.score,
    missingPerformanceFields: performanceCoverage.missing,
    inferredYield: !isPresent(record.yield) && isPresent(record.conversion) && isPresent(record.selectivity)
      ? Number(record.conversion) * Number(record.selectivity)
      : null,
    yieldInferred: !isPresent(record.yield) && isPresent(record.conversion) && isPresent(record.selectivity),
    evidenceReadiness,
    dataCoverage: dataCoverage.score,
    dataCoverageAvailable: dataCoverage.available,
    dataCoverageTotal: dataCoverage.total,
    missingFields,
  }
}
