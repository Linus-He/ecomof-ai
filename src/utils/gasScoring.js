// @ts-nocheck

export const GAS_SCORE_DEFAULT_WEIGHTS = {
  uptake: 0.22,
  selectivity: 0.22,
  workingCapacity: 0.20,
  regenerability: 0.14,
  stability: 0.12,
  evidence: 0.10,
}

const HIGHER_IS_BETTER = new Set([
  "primaryUptake",
  "uptake",
  "selectivity",
  "workingCapacity",
  "regenerability",
  "surfaceArea",
  "poreVolume",
  "voidFraction",
  "confidence",
  "stability",
  "evidence",
])

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function normalizeWeights(weights) {
  const cleaned = Object.fromEntries(
    Object.entries({ ...GAS_SCORE_DEFAULT_WEIGHTS, ...weights }).map(([key, value]) => [key, Math.max(0.01, Number(value) || 0)])
  )
  const sum = Object.values(cleaned).reduce((total, value) => total + value, 0) || 1
  return Object.fromEntries(Object.entries(cleaned).map(([key, value]) => [key, value / sum]))
}

function shift(weights, key, delta) {
  return { ...weights, [key]: Math.max(0.01, (weights[key] || 0) + delta) }
}

export function getScenarioWeights(gasPair = "CO2/N2", targetPriority = "Balanced") {
  let weights = { ...GAS_SCORE_DEFAULT_WEIGHTS }
  const pair = String(gasPair || "").toUpperCase()
  const priority = String(targetPriority || "Balanced").toLowerCase()

  if (pair === "CO2/N2") {
    weights = shift(shift(weights, "selectivity", 0.04), "stability", 0.02)
  } else if (pair === "CO2/CH4") {
    weights = shift(shift(weights, "selectivity", 0.04), "regenerability", 0.03)
  } else if (pair === "H2/CO2") {
    weights = shift(shift(weights, "workingCapacity", 0.04), "regenerability", 0.03)
  } else if (pair === "O2/N2") {
    weights = shift(shift(weights, "selectivity", 0.06), "evidence", 0.02)
  } else if (pair === "VOC/N2") {
    weights = shift(shift(weights, "uptake", 0.05), "regenerability", 0.04)
  }

  if (priority.includes("uptake")) weights = shift(weights, "uptake", 0.12)
  if (priority.includes("selectivity")) weights = shift(weights, "selectivity", 0.12)
  if (priority.includes("working")) weights = shift(weights, "workingCapacity", 0.12)
  if (priority.includes("regenerability")) weights = shift(weights, "regenerability", 0.12)
  if (priority.includes("stability")) weights = shift(weights, "stability", 0.12)

  return normalizeWeights(weights)
}

export function getGasMetricValue(record = {}, metric = "") {
  record = record || {}
  if (metric === "uptake") return finite(record.primaryUptake)
  if (metric === "stability") return getStabilityScore(record)
  if (metric === "evidence") return getEvidenceScore(record)
  return finite(record[metric])
}

export function normalizeGasMetric(value, metric, records = []) {
  const current = finite(value)
  if (current == null) return null
  const values = records
    .map(record => getGasMetricValue(record, metric))
    .filter(number => Number.isFinite(number))
  if (!values.length) return 0.5
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return 0.72
  const raw = (current - min) / (max - min)
  return HIGHER_IS_BETTER.has(metric) ? clamp(raw) : clamp(1 - raw)
}

function stabilityCategoryScore(value) {
  const label = String(value || "").toLowerCase()
  if (label.includes("high") || label.includes("stable")) return 1
  if (label.includes("moderate") || label.includes("partial")) return 0.72
  if (label.includes("low") || label.includes("sensitive")) return 0.38
  return 0.5
}

export function getStabilityScore(record = {}, scenarioConfig = {}) {
  record = record || {}
  scenarioConfig = scenarioConfig || {}
  const water = stabilityCategoryScore(record.waterStability)
  const thermalRaw = finite(record.thermalStability)
  const thermal = thermalRaw == null ? 0.55 : clamp((thermalRaw - 180) / 320)
  const density = finite(record.density)
  const densityScore = density == null ? 0.62 : clamp(1 - Math.abs(density - 0.75) / 1.1)
  let score = water * 0.42 + thermal * 0.38 + densityScore * 0.2
  const pair = String(scenarioConfig.gasPair || record.gasPair || "").toUpperCase()
  if (pair === "VOC/N2" && thermal < 0.58) score -= 0.08
  if (pair === "CO2/N2" && water < 0.55) score -= 0.07
  if (Number(scenarioConfig.pressureBar || record.pressureBar || 0) > 10 && thermal < 0.65) score -= 0.05
  return clamp(score)
}

export function getEvidenceScore(record = {}) {
  record = record || {}
  const level = String(record.evidenceLevel || "C").toUpperCase()
  const levelScore = level === "A" ? 1 : level === "B" ? 0.78 : level === "C" ? 0.52 : 0.28
  const confidence = finite(record.confidence)
  const confidenceScore = confidence == null ? 0.62 : clamp(confidence)
  const type = String(record.dataType || "").toLowerCase()
  const typeFactor = type.includes("experimental") || type.includes("literature") ? 1
    : type.includes("simulated") || type.includes("gcmc") || type.includes("iast") ? 0.88
      : type.includes("predicted") || type.includes("ml") ? 0.78
        : type.includes("derived") || type.includes("rule") ? 0.64
          : type.includes("demo") || type.includes("placeholder") ? 0.44
            : 0.6
  return clamp(levelScore * 0.56 + confidenceScore * 0.3 + typeFactor * 0.14)
}

export function getEvidencePenalty(record = {}) {
  record = record || {}
  return (1 - getEvidenceScore(record)) * 8
}

export function getStabilityPenalty(record = {}, scenarioConfig = {}) {
  record = record || {}
  scenarioConfig = scenarioConfig || {}
  const stability = getStabilityScore(record, scenarioConfig)
  const water = String(record.waterStability || "").toLowerCase()
  let penalty = (1 - stability) * 7
  if (String(scenarioConfig.targetPriority || "").toLowerCase().includes("stability") && water.includes("low")) penalty += 3
  return penalty
}

function getConditionPenalty(record = {}, scenarioConfig = {}) {
  record = record || {}
  scenarioConfig = scenarioConfig || {}
  const temperatureDelta = Math.abs((finite(record.temperatureK) ?? 298) - (finite(scenarioConfig.temperatureK) ?? 298))
  const pressureDelta = Math.abs((finite(record.pressureBar) ?? 1) - (finite(scenarioConfig.pressureBar) ?? 1))
  const temperaturePenalty = Math.min(3, temperatureDelta / 45)
  const pressurePenalty = Math.min(3, pressureDelta / 5)
  return temperaturePenalty + pressurePenalty
}

function getToxicityPenalty(record = {}) {
  record = record || {}
  const concern = String(record.toxicityConcern || "").toLowerCase()
  if (concern.includes("high")) return 5
  if (concern.includes("moderate")) return 2.5
  if (concern.includes("pending")) return 1.5
  return 0.5
}

function metricLabel(metric) {
  return ({
    uptake: "uptake",
    selectivity: "selectivity",
    workingCapacity: "working capacity",
    regenerability: "regenerability",
    stability: "stability",
    evidence: "evidence",
  })[metric] || metric
}

export function scoreGasCandidate(record = {}, scenarioConfig = {}, peerRecords = []) {
  record = record || {}
  scenarioConfig = scenarioConfig || {}
  const peers = peerRecords.length ? peerRecords : [record]
  const weights = getScenarioWeights(scenarioConfig.gasPair || record.gasPair, scenarioConfig.targetPriority)
  const normalized = {
    uptake: normalizeGasMetric(record.primaryUptake, "primaryUptake", peers),
    selectivity: normalizeGasMetric(record.selectivity, "selectivity", peers),
    workingCapacity: normalizeGasMetric(record.workingCapacity, "workingCapacity", peers),
    regenerability: normalizeGasMetric(record.regenerability, "regenerability", peers),
    stability: getStabilityScore(record, scenarioConfig),
    evidence: getEvidenceScore(record),
  }
  const missingMetrics = Object.entries(normalized).filter(([, value]) => value == null).map(([key]) => key)
  const scoreInputs = Object.fromEntries(Object.entries(normalized).map(([key, value]) => [key, value == null ? 0.42 : value]))
  const contributions = Object.fromEntries(Object.entries(weights).map(([key, weight]) => [key, weight * (scoreInputs[key] || 0) * 100]))
  const evidencePenalty = getEvidencePenalty(record)
  const stabilityPenalty = getStabilityPenalty(record, scenarioConfig)
  const conditionPenalty = getConditionPenalty(record, scenarioConfig)
  const riskPenalty = getToxicityPenalty(record) + evidencePenalty * 0.35 + stabilityPenalty * 0.35 + conditionPenalty
  const weightedScore = Object.values(contributions).reduce((total, value) => total + value, 0)
  const score = clamp(weightedScore - riskPenalty, 0, 100)
  const rankedMetrics = Object.entries(scoreInputs)
    .map(([key, value]) => ({ key, value, contribution: contributions[key] || 0 }))
    .sort((a, b) => b.contribution - a.contribution)

  return {
    ...record,
    score,
    score100: Math.round(score),
    scoreBreakdown: {
      weights,
      normalized,
      contributions,
      riskPenalty,
      evidencePenalty,
      stabilityPenalty,
      conditionPenalty,
      missingMetrics,
      topDrivers: rankedMetrics.slice(0, 3).map(item => metricLabel(item.key)),
      draggers: rankedMetrics.slice(-3).reverse().map(item => metricLabel(item.key)),
    },
  }
}

export function rankGasCandidates(records = [], scenarioConfig = {}) {
  const gasPair = String(scenarioConfig.gasPair || "").toUpperCase()
  const peers = records.filter(record => !gasPair || String(record.gasPair || "").toUpperCase() === gasPair)
  return peers
    .map(record => scoreGasCandidate(record, scenarioConfig, peers))
    .sort((a, b) => b.score - a.score || String(a.displayName || "").localeCompare(String(b.displayName || "")))
}
