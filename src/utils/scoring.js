const DEFAULT_RANGES = {
  co2Uptake: [0, 10],
  selectivity: [0, 120],
  thermodynamicIndicator: [15, 55],
  poreSizeA: [3, 30],
  surfaceArea: [300, 3000],
  poreVolume: [0.2, 1.8],
  bandGap: [0.5, 5],
}

export const DEFAULT_SCORING_WEIGHTS = {
  ecoscreen: {
    performance: 0.2,
    stability: 0.22,
    sustainability: 0.24,
    cost: 0.16,
    evidenceConfidence: 0.18,
  },
  performance: {
    co2Uptake: 0.3,
    selectivity: 0.25,
    thermodynamicIndicator: 0.18,
    stability: 0.12,
    evidenceConfidence: 0.15,
  },
  catalysis: {
    co2Affinity: 0.16,
    activeSite: 0.18,
    poreAccessibility: 0.14,
    stability: 0.16,
    electronicProperty: 0.13,
    sustainability: 0.11,
    evidenceConfidence: 0.12,
  },
}

const EVIDENCE_CONFIDENCE = {
  experimental: 1,
  "literature-supported": 0.85,
  "simulation-supported": 0.75,
  "ML-predicted": 0.65,
  "ml-predicted": 0.65,
  "rule-based": 0.5,
  "needs-validation": 0.3,
  high: 0.85,
  medium: 0.65,
  "low-medium": 0.5,
  low: 0.3,
}

const LEVEL_ALIASES = {
  High: "literature-supported",
  Medium: "rule-based",
  "Low-medium": "rule-based",
  Low: "needs-validation",
}

const STABILITY_SCORE = {
  high: 92,
  medium: 64,
  low: 32,
  unmarked: 45,
}

const RISK_SCORE = {
  low: 88,
  medium: 58,
  high: 25,
  unmarked: 50,
}

const ACTIVE_SITE_CUES = [
  "open",
  "lewis",
  "redox",
  "oxo",
  "porphyrin",
  "metalated",
  "metalation",
  "amine",
  "cluster",
]

export function clamp(value, min = 0, max = 100) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.max(min, Math.min(max, number))
}

export function normalizeValue(value, min = 0, max = 100) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  if (max === min) return 0
  return clamp(((number - min) / (max - min)) * 100)
}

export function normalizeEvidenceLevel(evidenceLevel) {
  if (!evidenceLevel) return "needs-validation"
  if (Array.isArray(evidenceLevel)) return normalizeEvidenceLevel(evidenceLevel[0])
  const text = String(evidenceLevel).trim()
  return LEVEL_ALIASES[text] || text.toLowerCase()
}

export function getEvidenceConfidence(evidenceLevel) {
  const normalized = normalizeEvidenceLevel(evidenceLevel)
  return EVIDENCE_CONFIDENCE[normalized] ?? 0.3
}

function normalizedText(value, fallback = "unmarked") {
  if (Array.isArray(value)) return normalizedText(value[0], fallback)
  return String(value || fallback).trim().toLowerCase()
}

function textIncludes(value, cues) {
  const text = Array.isArray(value) ? value.join(" ") : String(value || "")
  return cues.some(cue => text.toLowerCase().includes(cue))
}

function stabilityScore(candidate) {
  const water = STABILITY_SCORE[normalizedText(candidate.waterStability)] ?? 45
  const thermal = STABILITY_SCORE[normalizedText(candidate.thermalStability)] ?? 45
  return (water + thermal) / 2
}

function sustainabilityScore(candidate) {
  const toxicity = RISK_SCORE[normalizedText(candidate.toxicityConcern)] ?? 50
  const risk = RISK_SCORE[normalizedText(candidate.sustainabilityRisk)] ?? toxicity
  return (toxicity + risk) / 2
}

function costScore(candidate) {
  return RISK_SCORE[normalizedText(candidate.costLevel)] ?? 50
}

function performanceCue(candidate) {
  const uptake = normalizeValue(candidate.co2Uptake, ...DEFAULT_RANGES.co2Uptake)
  const area = normalizeValue(candidate.surfaceArea, ...DEFAULT_RANGES.surfaceArea)
  const pore = normalizeValue(candidate.poreSizeA, ...DEFAULT_RANGES.poreSizeA)
  return clamp(uptake * 0.5 + area * 0.25 + pore * 0.25)
}

function selectivityCue(candidate) {
  return normalizeValue(candidate.selectivity ?? candidate.selectivityCo2N2 ?? candidate.separationFactor, ...DEFAULT_RANGES.selectivity)
}

function thermodynamicCue(candidate) {
  const qst = candidate.qst0 ?? candidate.thermodynamicIndicator
  if (Number.isFinite(Number(qst))) {
    const normalized = normalizeValue(qst, ...DEFAULT_RANGES.thermodynamicIndicator)
    return clamp(100 - Math.abs(normalized - 58) * 1.2)
  }
  const uptake = normalizeValue(candidate.co2Uptake, ...DEFAULT_RANGES.co2Uptake)
  const band = normalizeValue(candidate.bandGap, ...DEFAULT_RANGES.bandGap)
  return clamp(uptake * 0.55 + (100 - Math.abs(band - 55)) * 0.45)
}

function activeSitePotential(candidate) {
  let score = textIncludes(candidate.activeSiteHypothesis, ACTIVE_SITE_CUES) ? 72 : 48
  if (candidate.bimetallic === true || normalizedText(candidate.bimetallic) === "possible" || normalizedText(candidate.bimetallic) === "yes") score += 9
  if (Array.isArray(candidate.metalNodes) && candidate.metalNodes.some(node => /cu|fe|co|ni|mn/i.test(node))) score += 8
  return clamp(score)
}

function poreAccessibility(candidate) {
  const pore = Number(candidate.poreSizeA)
  const area = normalizeValue(candidate.surfaceArea, ...DEFAULT_RANGES.surfaceArea)
  const poreFit = Number.isFinite(pore) ? clamp(100 - Math.abs(pore - 12) * 4.2) : 45
  return clamp(poreFit * 0.68 + area * 0.32)
}

function electronicProperty(candidate) {
  const bandGap = Number(candidate.bandGap)
  if (!Number.isFinite(bandGap)) return 45
  return clamp(100 - Math.abs(bandGap - 2.4) * 24)
}

function co2Affinity(candidate) {
  return normalizeValue(candidate.co2Uptake, ...DEFAULT_RANGES.co2Uptake)
}

function taskFit(candidate, task) {
  const taskId = typeof task === "string" ? task : task?.id
  if (!taskId) return 1
  const classes = Array.isArray(candidate.reactionClasses) ? candidate.reactionClasses.map(item => String(item).toLowerCase()) : []
  if (classes.includes(String(taskId).toLowerCase())) return 1
  const label = String(task?.name || task?.label || "").toLowerCase()
  if (label && classes.some(item => label.includes(item) || item.includes(label))) return 1
  if (taskId === "custom_task") return 0.78
  return 0.62
}

function weightedScore(parts, weights) {
  const entries = Object.entries(weights || {})
  const weightTotal = entries.reduce((sum, [, weight]) => sum + Math.max(0, Number(weight) || 0), 0) || 1
  const score = entries.reduce((sum, [key, weight]) => sum + (Number(parts[key]) || 0) * (Math.max(0, Number(weight) || 0) / weightTotal), 0)
  return clamp(score)
}

export function getScoreBreakdown(candidate, moduleType, task) {
  if (moduleType === "performance") {
    return [
      { key: "co2Uptake", label: "CO₂ uptake", labelZh: "CO₂ 吸附量", value: co2Affinity(candidate) },
      { key: "selectivity", label: "Selectivity", labelZh: "选择性", value: selectivityCue(candidate) },
      { key: "thermodynamicIndicator", label: "Thermodynamic indicator", labelZh: "热力学指标", value: thermodynamicCue(candidate) },
      { key: "stability", label: "Stability", labelZh: "稳定性", value: stabilityScore(candidate) },
      { key: "evidenceConfidence", label: "Evidence Confidence", labelZh: "证据置信度", value: getEvidenceConfidence(candidate.evidenceLevel) * 100 },
    ]
  }
  if (moduleType === "catalysis") {
    return [
      { key: "co2Affinity", label: "CO₂ Affinity", labelZh: "CO₂ 亲和性", value: co2Affinity(candidate) },
      { key: "activeSite", label: "Active Site Potential", labelZh: "活性位潜力", value: activeSitePotential(candidate) },
      { key: "poreAccessibility", label: "Pore Accessibility", labelZh: "孔道可达性", value: poreAccessibility(candidate) },
      { key: "stability", label: "Stability", labelZh: "稳定性", value: stabilityScore(candidate) },
      { key: "electronicProperty", label: "Electronic Property", labelZh: "电子性质", value: electronicProperty(candidate) },
      { key: "sustainability", label: "Sustainability", labelZh: "可持续性", value: sustainabilityScore(candidate) },
      { key: "evidenceConfidence", label: "Evidence Confidence", labelZh: "证据置信度", value: getEvidenceConfidence(candidate.evidenceLevel) * 100 },
    ].map(item => ({ ...item, value: item.key === "co2Affinity" ? clamp(item.value * taskFit(candidate, task)) : item.value }))
  }
  return [
    { key: "performance", label: "Performance", labelZh: "性能", value: performanceCue(candidate) },
    { key: "stability", label: "Stability", labelZh: "稳定性", value: stabilityScore(candidate) },
    { key: "sustainability", label: "Sustainability", labelZh: "可持续性", value: sustainabilityScore(candidate) },
    { key: "cost", label: "Cost", labelZh: "成本", value: costScore(candidate) },
    { key: "evidenceConfidence", label: "Evidence Confidence", labelZh: "证据置信度", value: getEvidenceConfidence(candidate.evidenceLevel) * 100 },
  ]
}

export function calculateEcoScore(candidate, weights = DEFAULT_SCORING_WEIGHTS.ecoscreen) {
  const parts = Object.fromEntries(getScoreBreakdown(candidate, "ecoscreen").map(item => [item.key, item.value]))
  return {
    score: Number(weightedScore(parts, weights).toFixed(1)),
    parts,
  }
}

export function calculatePerformanceScore(candidate, weights = DEFAULT_SCORING_WEIGHTS.performance) {
  const parts = Object.fromEntries(getScoreBreakdown(candidate, "performance").map(item => [item.key, item.value]))
  return {
    score: Number(weightedScore(parts, weights).toFixed(1)),
    parts,
  }
}

export function calculateCatalysisScore(candidate, task, weights = DEFAULT_SCORING_WEIGHTS.catalysis) {
  const parts = Object.fromEntries(getScoreBreakdown(candidate, "catalysis", task).map(item => [item.key, item.value]))
  const baseScore = weightedScore(parts, weights)
  return {
    score: Number(clamp(baseScore * taskFit(candidate, task)).toFixed(1)),
    parts,
  }
}

export function getWeightContribution(candidate, weights = {}, moduleType = "ecoscreen", task) {
  const breakdown = getScoreBreakdown(candidate, moduleType, task)
  const activeWeights = weights[moduleType] || weights || DEFAULT_SCORING_WEIGHTS[moduleType] || DEFAULT_SCORING_WEIGHTS.ecoscreen
  const total = Object.values(activeWeights).reduce((sum, weight) => sum + Math.max(0, Number(weight) || 0), 0) || 1
  return breakdown.map(item => {
    const weight = Math.max(0, Number(activeWeights[item.key]) || 0) / total
    return {
      dimension: item.label,
      dimensionZh: item.labelZh,
      key: item.key,
      weight,
      normalizedScore: clamp(item.value),
      contribution: Number((weight * clamp(item.value)).toFixed(1)),
    }
  })
}

export function buildScoredCandidates(candidates, moduleType, weights, task) {
  const scorer = moduleType === "performance"
    ? calculatePerformanceScore
    : moduleType === "catalysis"
      ? calculateCatalysisScore
      : calculateEcoScore
  const activeWeights = weights?.[moduleType] || weights || DEFAULT_SCORING_WEIGHTS[moduleType]
  return (candidates || [])
    .map(candidate => {
      const result = moduleType === "catalysis" ? scorer(candidate, task, activeWeights) : scorer(candidate, activeWeights)
      return {
        ...candidate,
        score: result.score,
        scoreParts: result.parts,
        scoreBreakdown: getScoreBreakdown(candidate, moduleType, task),
        weightContribution: getWeightContribution(candidate, activeWeights, moduleType, task),
      }
    })
    .filter(candidate => Number.isFinite(Number(candidate.score)))
    .sort((a, b) => b.score - a.score)
}

export function scoreDistribution(scoredCandidates, bucketSize = 10) {
  const buckets = Array.from({ length: Math.ceil(100 / bucketSize) }, (_, index) => {
    const min = index * bucketSize
    const max = min + bucketSize
    return { range: `${min}-${max}`, min, max, count: 0 }
  })
  ;(scoredCandidates || []).forEach(candidate => {
    const score = clamp(candidate.score)
    const index = Math.min(buckets.length - 1, Math.floor(score / bucketSize))
    buckets[index].count += 1
  })
  return buckets
}

export function evidenceDistribution(scoredCandidates) {
  const levels = ["experimental", "literature-supported", "simulation-supported", "ML-predicted", "rule-based", "needs-validation"]
  const rows = Object.fromEntries(levels.map(level => [level, { level, count: 0 }]))
  ;(scoredCandidates || []).forEach(candidate => {
    const level = normalizeEvidenceLevel(candidate.evidenceLevel)
    const key = rows[level] ? level : "needs-validation"
    rows[key].count += 1
  })
  return levels.map(level => rows[level])
}

export function sensitivityRows(candidates, moduleType, weights, task, dimension, delta = 0.2) {
  const activeWeights = { ...(weights?.[moduleType] || weights || DEFAULT_SCORING_WEIGHTS[moduleType]) }
  const target = dimension || Object.keys(activeWeights)[0]
  const scenarios = [
    { scenario: "-20%", factor: 1 - delta },
    { scenario: "Base", factor: 1 },
    { scenario: "+20%", factor: 1 + delta },
  ]
  return scenarios.flatMap(({ scenario, factor }) => {
    const scenarioWeights = { ...activeWeights, [target]: (Number(activeWeights[target]) || 0) * factor }
    return buildScoredCandidates(candidates, moduleType, scenarioWeights, task).slice(0, 5).map((candidate, index) => ({
      scenario,
      rank: index + 1,
      name: candidate.name,
      score: candidate.score,
    }))
  })
}
