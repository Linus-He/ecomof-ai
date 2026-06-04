// @ts-nocheck

const DEFAULT_MIN_TEMP_C = 150
const DEFAULT_FRAMEWORK_WEIGHTS = {
  hydrothermalEvidenceStrength: 0.18,
  thermalStability: 0.12,
  waterBlockingResistance: 0.1,
  poreAccessibility: 0.14,
  c1IntermediateAccessibility: 0.12,
  alOFrameworkRobustness: 0.14,
  linkerMicroenvironmentMatch: 0.1,
  evidenceConfidence: 0.06,
  collapseRisk: 0.14,
}

const DEFAULT_DOPANT_WEIGHTS = {
  activeSiteValue: 0.34,
  mechanismFeasibility: 0.28,
  aqueousStability: 0.16,
  evidenceSupport: 0.12,
  riskPenalty: 0.1,
}

export const METAL_DESCRIPTOR_KEYS = [
  "co2ActivationPotential",
  "redoxAdaptability",
  "lewisAcidContribution",
  "oxoAffinity",
  "formateAffinityProxy",
  "hydrothermalRisk",
  "leachingRisk",
  "aggregationRisk",
  "costPenalty",
  "toxicityPenalty",
  "nobleMetalPenalty",
]

const COMPETITIVE_METALS = ["W", "V", "Ti", "Zr", "Fe"]
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i
const CONFIDENCE_SCORES = {
  high: 0.82,
  verified: 0.9,
  medium: 0.64,
  "medium-high": 0.74,
  low: 0.36,
  pending: 0.22,
}

const LEVELS = [
  { max: 0.4, label: "low" },
  { max: 0.65, label: "medium" },
  { max: 0.8, label: "medium-high" },
  { max: 1.01, label: "high" },
]

function clamp01(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(1, Math.max(0, numeric))
}

function round3(value) {
  return Number(clamp01(value).toFixed(3))
}

function roundMetric(value, digits = 3) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Number(numeric.toFixed(digits))
}

function avg(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function levelFor(score) {
  const normalized = clamp01(score)
  return LEVELS.find(level => normalized < level.max)?.label || "high"
}

export function descriptorValue(field, fallback = 0) {
  if (field && typeof field === "object" && !Array.isArray(field) && "value" in field) {
    return clamp01(field.value)
  }
  return clamp01(field ?? fallback)
}

function descriptorSourceBasis(field) {
  if (!field || typeof field !== "object") return "pending"
  return field.sourceBasis || field.basis || "pending"
}

function descriptorConfidence(field) {
  if (!field || typeof field !== "object") return "pending"
  return field.confidence || "pending"
}

function descriptorDoi(field) {
  if (!field || typeof field !== "object") return null
  return field.sourceDoi || field.doi || null
}

function confidenceScore(value) {
  const text = String(value || "").toLowerCase()
  const exact = CONFIDENCE_SCORES[text]
  if (Number.isFinite(exact)) return exact
  if (text.includes("high")) return CONFIDENCE_SCORES.high
  if (text.includes("medium")) return CONFIDENCE_SCORES.medium
  if (text.includes("low")) return CONFIDENCE_SCORES.low
  if (text.includes("pending")) return CONFIDENCE_SCORES.pending
  return clamp01(value)
}

function evidenceConfidenceScore(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return confidenceScore(value.confidence || value.evidenceConfidence || value.sourceConfidence)
  }
  const text = String(value || "").toLowerCase()
  const score = confidenceScore(text)
  return score || clamp01(value)
}

export function normalizePerturbedWeights(weights, fallback = DEFAULT_DOPANT_WEIGHTS) {
  const source = { ...fallback, ...(weights || {}) }
  const total = Object.values(source).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
  if (!total) return { ...fallback }
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, Math.max(0, Number(value) || 0) / total]))
}

function normalizeWeights(weights, fallback) {
  return normalizePerturbedWeights(weights, fallback)
}

function seededRandom(seed = 170) {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function applyHydrothermalGate(candidate, rules) {
  const stability = candidate?.waterStability || {}
  const minTemp = rules?.hydrothermalHardGate?.minimumTempC ?? DEFAULT_MIN_TEMP_C
  const hasTempEvidence =
    typeof stability.max_tested_temp_C === "number" &&
    stability.max_tested_temp_C >= minTemp
  const hasPxrdEvidence = stability.post_treatment_PXRD_retained === true

  if (!hasTempEvidence) {
    return {
      ...candidate,
      hydrothermalGate: {
        status: "fail",
        reason: `No hydrothermal stability evidence at >=${minTemp}C.`,
      },
      organicAcidScore: {
        ...(candidate?.organicAcidScore || {}),
        oacs: 0,
        collapseRisk: 1,
        evidenceLevel: "rejected",
      },
    }
  }

  if (!hasPxrdEvidence) {
    return {
      ...candidate,
      hydrothermalGate: {
        status: "needs_review",
        reason: "High-temperature water stability is reported, but post-treatment PXRD evidence is missing.",
      },
      organicAcidScore: {
        ...(candidate?.organicAcidScore || {}),
        oacs: 0,
        collapseRisk: 1,
        evidenceLevel: "needs_review",
      },
    }
  }

  return {
    ...candidate,
    hydrothermalGate: {
      status: "pass",
      reason: `Hydrothermal evidence meets >=${minTemp}C threshold with post-treatment PXRD.`,
    },
  }
}

export function calculateOACS(candidate, weights = DEFAULT_FRAMEWORK_WEIGHTS) {
  const gated = candidate?.hydrothermalGate?.status ? candidate : applyHydrothermalGate(candidate)
  if (gated?.hydrothermalGate?.status !== "pass") {
    return {
      ...gated,
      organicAcidScore: {
        ...(gated?.organicAcidScore || {}),
        oacs: 0,
        collapseRisk: 1,
        evidenceLevel: gated?.hydrothermalGate?.status === "needs_review" ? "needs_review" : "rejected",
        weightingMethod: "CRITIC+AHP",
      },
    }
  }

  const w = normalizeWeights(weights, DEFAULT_FRAMEWORK_WEIGHTS)
  const scores = gated.descriptorScores || {}
  const positive =
    w.hydrothermalEvidenceStrength * clamp01(scores.hydrothermalEvidenceStrength) +
    w.thermalStability * clamp01(scores.thermalStability) +
    w.waterBlockingResistance * clamp01(scores.waterBlockingResistance) +
    w.poreAccessibility * clamp01(scores.poreAccessibility) +
    w.c1IntermediateAccessibility * clamp01(scores.c1IntermediateAccessibility) +
    w.alOFrameworkRobustness * clamp01(scores.alOFrameworkRobustness) +
    w.linkerMicroenvironmentMatch * clamp01(scores.linkerMicroenvironmentMatch) +
    w.evidenceConfidence * clamp01(scores.evidenceConfidence)
  const penalty = w.collapseRisk * clamp01(scores.collapseRisk)
  const oacs = round3(positive - penalty)

  return {
    ...gated,
    organicAcidScore: {
      ...(gated.organicAcidScore || {}),
      oacs,
      collapseRisk: round3(scores.collapseRisk),
      evidenceLevel: "top_recommendation_eligible",
      weightingMethod: "CRITIC+AHP",
      contributionBreakdown: {
        hydrothermalEvidenceStrength: roundMetric(w.hydrothermalEvidenceStrength * clamp01(scores.hydrothermalEvidenceStrength)),
        thermalStability: roundMetric(w.thermalStability * clamp01(scores.thermalStability)),
        waterBlockingResistance: roundMetric(w.waterBlockingResistance * clamp01(scores.waterBlockingResistance)),
        poreAccessibility: roundMetric(w.poreAccessibility * clamp01(scores.poreAccessibility)),
        c1IntermediateAccessibility: roundMetric(w.c1IntermediateAccessibility * clamp01(scores.c1IntermediateAccessibility)),
        alOFrameworkRobustness: roundMetric(w.alOFrameworkRobustness * clamp01(scores.alOFrameworkRobustness)),
        linkerMicroenvironmentMatch: roundMetric(w.linkerMicroenvironmentMatch * clamp01(scores.linkerMicroenvironmentMatch)),
        evidenceConfidence: roundMetric(w.evidenceConfidence * clamp01(scores.evidenceConfidence)),
        collapseRiskPenalty: roundMetric(-penalty),
      },
    },
  }
}

export function calculateNodeSubstitutionScore(metal, framework) {
  const d = metal?.mechanismDescriptors || {}
  const score = clamp01(1 - avg([
    d.ionicRadiusMismatchPenalty,
    d.coordinationGeometryMismatchPenalty,
    d.chargeBalancePenalty,
    d.nodeDistortionRisk,
  ]))
  return {
    score: round3(score),
    level: levelFor(score),
    comment: score < 0.42
      ? `Direct substitution into Al nodes is unlikely for ${metal?.metal || "this metal"} because of ionic radius, charge, and coordination geometry mismatch.`
      : `Direct node substitution remains a secondary path and requires framework-specific evidence for ${framework?.displayName || "the selected Al-MOF"}.`,
  }
}

export function calculateDefectAnchoringScore(metal, framework) {
  const d = metal?.mechanismDescriptors || {}
  const frameworkDefectFit = avg([
    framework?.descriptorScores?.alOFrameworkRobustness,
    framework?.descriptorScores?.linkerMicroenvironmentMatch,
    framework?.descriptorScores?.evidenceConfidence,
  ])
  const score = avg([
    d.missingLinkerDefectCompatibility,
    d.terminalOHAvailability,
    d.metalOxoAnchoringTrend ?? descriptorValue(metal?.oxoAffinity),
    d.defectBindingEnergyProxy,
    d.postSyntheticModificationFeasibility,
    frameworkDefectFit,
  ])
  return {
    score: round3(score),
    level: levelFor(score),
    comment: metal?.metal === "Mo"
      ? "Defect-anchored Mo-oxo species is the preferred mechanism in this hypothesis."
      : "Defect anchoring is scored from missing-linker compatibility, terminal OH availability, oxo affinity, and post-synthetic feasibility.",
  }
}

export function calculatePoreConfinementScore(metal, framework) {
  const d = metal?.mechanismDescriptors || {}
  const pld = Number(framework?.pldA)
  const lcd = Number(framework?.lcdA)
  const speciesSize = Number(d.metalSpeciesSizeA) || 4
  const pldFit = Number.isFinite(pld) ? clamp01(1 - Math.abs(pld - speciesSize) / 6) : 0.45
  const lcdFit = Number.isFinite(lcd) ? clamp01(lcd / Math.max(9, speciesSize * 2.2)) : 0.45
  const poreFit = avg([
    pldFit,
    lcdFit,
    d.confinementFitPrior,
    framework?.descriptorScores?.poreAccessibility,
    framework?.descriptorScores?.c1IntermediateAccessibility,
  ])
  const riskPenalty = avg([descriptorValue(metal?.aggregationRisk), descriptorValue(metal?.leachingRisk)]) * 0.3
  const score = clamp01(poreFit - riskPenalty)
  return {
    score: round3(score),
    level: levelFor(score),
    comment: metal?.metal === "Mo"
      ? "Pore confinement may suppress MoOx aggregation and leaching when the Al-MOF window is accessible."
      : "Pore confinement reflects species size, PLD/LCD fit, pore accessibility, aggregation risk, and leaching risk.",
  }
}

export function calculateMechanismFeasibility(metal, framework) {
  const nodeSubstitution = calculateNodeSubstitutionScore(metal, framework)
  const defectAnchoring = calculateDefectAnchoringScore(metal, framework)
  const poreConfinement = calculatePoreConfinementScore(metal, framework)
  const entries = [
    ["nodeSubstitution", nodeSubstitution],
    ["defectAnchoring", defectAnchoring],
    ["poreConfinement", poreConfinement],
  ]
  const preferred = entries.sort((a, b) => b[1].score - a[1].score)[0]
  return {
    nodeSubstitution,
    defectAnchoring,
    poreConfinement,
    preferredPath: preferred[0],
    score: preferred[1].score,
    level: levelFor(preferred[1].score),
  }
}

export function inferMostLikelyMetalForm(mechanism) {
  const path = typeof mechanism === "string" ? mechanism : mechanism?.preferredPath
  if (path === "defectAnchoring") return "defect-anchored Mo-oxo species"
  if (path === "poreConfinement") return "pore-confined MoOx-like species"
  if (path === "nodeSubstitution") return "node-substituted metal site; lower-confidence path"
  return "mechanism pending review"
}

function activeSiteValue(metal) {
  return avg([
    descriptorValue(metal?.co2ActivationPotential),
    descriptorValue(metal?.redoxAdaptability),
    descriptorValue(metal?.lewisAcidContribution),
    descriptorValue(metal?.formateAffinityProxy),
  ])
}

function aqueousStabilityValue(metal, framework) {
  const frameworkCompatibility = clamp01(framework?.organicAcidScore?.oacs ?? framework?.descriptorScores?.hydrothermalEvidenceStrength)
  return clamp01(0.55 * frameworkCompatibility + 0.45 * (1 - descriptorValue(metal?.hydrothermalRisk)))
}

function riskValue(metal) {
  return avg([
    descriptorValue(metal?.leachingRisk),
    descriptorValue(metal?.aggregationRisk),
    descriptorValue(metal?.nobleMetalPenalty),
    descriptorValue(metal?.costPenalty),
  ])
}

export function calculateDMRS(metal, framework, weights = DEFAULT_DOPANT_WEIGHTS) {
  const w = normalizeWeights(weights, DEFAULT_DOPANT_WEIGHTS)
  const mechanism = calculateMechanismFeasibility(metal, framework)
  const activeSite = activeSiteValue(metal)
  const aqueousStability = aqueousStabilityValue(metal, framework)
  const formateProxy = metal?.formateAffinityProxy || {}
  const evidenceSupport = avg([
    evidenceConfidenceScore(metal?.evidenceConfidence),
    confidenceScore(descriptorConfidence(formateProxy)),
    clamp01((formateProxy?.evidence_count || formateProxy?.evidenceCount || 0) / 4),
    formateProxy?.direct_dft_available ? 0.85 : 0.45,
  ])
  const risk = riskValue(metal)
  const score =
    w.activeSiteValue * activeSite +
    w.mechanismFeasibility * mechanism.score +
    w.aqueousStability * aqueousStability +
    w.evidenceSupport * evidenceSupport -
    w.riskPenalty * risk

  const contributionBreakdown = [
    { key: "co2ActivationPotential", label: "CO2 activation", value: roundMetric(w.activeSiteValue * descriptorValue(metal?.co2ActivationPotential) * 0.25) },
    { key: "redoxAdaptability", label: "Redox adaptability", value: roundMetric(w.activeSiteValue * descriptorValue(metal?.redoxAdaptability) * 0.25) },
    { key: "lewisAcidContribution", label: "Lewis acid contribution", value: roundMetric(w.activeSiteValue * descriptorValue(metal?.lewisAcidContribution) * 0.25) },
    { key: "defectAnchoringFeasibility", label: "Defect anchoring feasibility", value: roundMetric(w.mechanismFeasibility * mechanism.defectAnchoring.score) },
    { key: "formateAffinityProxy", label: "Formate affinity proxy", value: roundMetric(w.activeSiteValue * descriptorValue(metal?.formateAffinityProxy) * 0.25) },
    { key: "aqueousStability", label: "Aqueous stability support", value: roundMetric(w.aqueousStability * aqueousStability) },
    { key: "evidenceSupport", label: "Evidence support", value: roundMetric(w.evidenceSupport * evidenceSupport) },
    { key: "leachingRisk", label: "Leaching risk", value: -roundMetric(w.riskPenalty * descriptorValue(metal?.leachingRisk) * 0.45) },
    { key: "aggregationRisk", label: "Aggregation risk", value: -roundMetric(w.riskPenalty * descriptorValue(metal?.aggregationRisk) * 0.35) },
    { key: "nodeSubstitutionMismatch", label: "Node substitution mismatch", value: -roundMetric(w.mechanismFeasibility * (1 - mechanism.nodeSubstitution.score) * 0.16) },
  ]

  const strengths = [
    ["CO2 activation", descriptorValue(metal?.co2ActivationPotential)],
    ["redox adaptability", descriptorValue(metal?.redoxAdaptability)],
    ["Lewis acid contribution", descriptorValue(metal?.lewisAcidContribution)],
    ["defect anchoring", mechanism.defectAnchoring.score],
    ["pore confinement", mechanism.poreConfinement.score],
  ].sort((a, b) => (b[1] || 0) - (a[1] || 0))
  const risks = [
    ["leaching", descriptorValue(metal?.leachingRisk)],
    ["aggregation", descriptorValue(metal?.aggregationRisk)],
    ["hydrothermal risk", descriptorValue(metal?.hydrothermalRisk)],
    ["cost / noble-metal penalty", descriptorValue(metal?.costPenalty) + descriptorValue(metal?.nobleMetalPenalty)],
  ].sort((a, b) => (b[1] || 0) - (a[1] || 0))

  return {
    metal: metal?.metal,
    category: metal?.category,
    isNobleMetal: Boolean(metal?.isNobleMetal),
    dmrs: round3(score),
    mechanism,
    mostLikelyForm: metal?.metal === "Mo" ? inferMostLikelyMetalForm(mechanism) : inferMostLikelyMetalForm(mechanism).replace("Mo", metal?.metal || "metal"),
    contributionBreakdown,
    activeSiteValue: round3(activeSite),
    aqueousStability: round3(aqueousStability),
    evidenceSupport: round3(evidenceSupport),
    riskPenalty: round3(risk),
    mainStrength: strengths[0]?.[0] || "pending",
    mainRisk: risks[0]?.[0] || "pending",
    negativeEvidence: metal?.negativeEvidence,
    dataStatus: getDataStatusBadge(metal),
    source: metal,
  }
}

export function getDataStatusBadge(item) {
  const status = item?.dataStatus || {}
  const level = String(status.level || status || "pending_validation").toLowerCase()
  const label = status.label || level.replaceAll("_", " ")
  const tone = level.includes("verified")
    ? "pass"
    : level.includes("pending") || level.includes("demo")
      ? "warn"
      : "info"
  return {
    level,
    label,
    description: status.description || "Validation status pending.",
    verified: Boolean(status.verified || level.includes("verified")),
    tone,
  }
}

export function validateSensitivityPerturbation(baseWeights, perturbationAudit = [], options = {}) {
  const perturbationRange = options.perturbationRange ?? 0.2
  const base = normalizePerturbedWeights(baseWeights, DEFAULT_DOPANT_WEIGHTS)

  if (!Array.isArray(perturbationAudit) && perturbationAudit && typeof perturbationAudit === "object") {
    return {
      sampleCount: perturbationAudit.sampleCount || 0,
      perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
      withinRange: perturbationAudit.withinRange !== false,
      normalized: perturbationAudit.normalized !== false,
      minPerturbationFactor: roundMetric(perturbationAudit.minFactor ?? 1, 3),
      maxPerturbationFactor: roundMetric(perturbationAudit.maxFactor ?? 1, 3),
      maxWeightSumDeviation: roundMetric(perturbationAudit.maxWeightSumDeviation ?? 0, 6),
      changedWeightCount: perturbationAudit.changedWeightCount ?? Object.keys(base).length,
      status: perturbationAudit.withinRange === false || perturbationAudit.normalized === false ? "needs_review" : "valid",
    }
  }

  const samples = perturbationAudit || []
  let withinRange = true
  let normalized = true
  let minFactor = Infinity
  let maxFactor = -Infinity
  let maxWeightSumDeviation = 0
  const changedWeights = new Set()

  samples.forEach(sample => {
    const raw = sample.raw || sample.perturbed || {}
    const weights = sample.weights || sample.normalized || {}
    Object.entries(base).forEach(([key, baseValue]) => {
      const rawValue = Number(raw[key])
      if (!Number.isFinite(rawValue) || !Number.isFinite(baseValue) || baseValue <= 0) return
      const factor = rawValue / baseValue
      minFactor = Math.min(minFactor, factor)
      maxFactor = Math.max(maxFactor, factor)
      if (factor < 1 - perturbationRange - 1e-9 || factor > 1 + perturbationRange + 1e-9) withinRange = false
      if (Math.abs(factor - 1) > 1e-6) changedWeights.add(key)
    })
    const weightSum = Object.values(weights).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const deviation = Math.abs(weightSum - 1)
    maxWeightSumDeviation = Math.max(maxWeightSumDeviation, deviation)
    if (deviation > 1e-6) normalized = false
  })

  return {
    sampleCount: samples.length,
    perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
    withinRange,
    normalized,
    minPerturbationFactor: Number.isFinite(minFactor) ? roundMetric(minFactor, 3) : 1,
    maxPerturbationFactor: Number.isFinite(maxFactor) ? roundMetric(maxFactor, 3) : 1,
    maxWeightSumDeviation: roundMetric(maxWeightSumDeviation, 6),
    changedWeightCount: changedWeights.size,
    status: withinRange && normalized ? "valid" : "needs_review",
  }
}

export function runFullMetalSensitivityDistribution(metals, framework, baseWeights = DEFAULT_DOPANT_WEIGHTS, iterations = 1000, options = {}) {
  const perturbationRange = options.perturbationRange ?? 0.2
  const rng = seededRandom(options.seed ?? 170)
  const rows = metals || []
  const rankStats = new Map(rows.map(metal => [metal.metal, { ranks: [], dmrsScores: [] }]))
  const base = normalizePerturbedWeights(baseWeights, DEFAULT_DOPANT_WEIGHTS)
  const validationAudit = {
    sampleCount: iterations,
    withinRange: true,
    normalized: true,
    minFactor: Infinity,
    maxFactor: -Infinity,
    maxWeightSumDeviation: 0,
    changedWeights: new Set(),
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const perturbed = Object.fromEntries(Object.entries(base).map(([key, value]) => {
      const delta = (rng() * 2 - 1) * perturbationRange
      const factor = 1 + delta
      validationAudit.minFactor = Math.min(validationAudit.minFactor, factor)
      validationAudit.maxFactor = Math.max(validationAudit.maxFactor, factor)
      if (factor < 1 - perturbationRange - 1e-9 || factor > 1 + perturbationRange + 1e-9) validationAudit.withinRange = false
      if (Math.abs(delta) > 1e-6) validationAudit.changedWeights.add(key)
      return [key, Math.max(0.0001, value * factor)]
    }))
    const weights = normalizePerturbedWeights(perturbed, base)
    const weightSum = Object.values(weights).reduce((sum, value) => sum + (Number(value) || 0), 0)
    const deviation = Math.abs(weightSum - 1)
    validationAudit.maxWeightSumDeviation = Math.max(validationAudit.maxWeightSumDeviation, deviation)
    if (deviation > 1e-6) validationAudit.normalized = false
    const ranked = rows
      .map(metal => calculateDMRS(metal, framework, weights))
      .sort((a, b) => b.dmrs - a.dmrs)
    ranked.forEach((row, index) => {
      const stat = rankStats.get(row.metal)
      if (!stat) return
      stat.ranks.push(index + 1)
      stat.dmrsScores.push(row.dmrs)
    })
  }

  const summaries = [...rankStats.entries()].map(([metal, stat]) => {
    const ranks = stat.ranks || []
    const meanRank = ranks.reduce((sum, rank) => sum + rank, 0) / Math.max(1, ranks.length)
    const variance = ranks.reduce((sum, rank) => sum + (rank - meanRank) ** 2, 0) / Math.max(1, ranks.length)
    const top1 = ranks.filter(rank => rank === 1).length / Math.max(1, ranks.length)
    const top3 = ranks.filter(rank => rank <= 3).length / Math.max(1, ranks.length)
    const dmrsMean = avg(stat.dmrsScores || [])
    return {
      metal,
      iterations,
      perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
      top1Probability: roundMetric(top1),
      top3Probability: roundMetric(top3),
      meanRank: roundMetric(meanRank, 2),
      rankStd: roundMetric(Math.sqrt(variance), 2),
      minRank: Math.min(...ranks),
      maxRank: Math.max(...ranks),
      rankRange: `${Math.min(...ranks)}-${Math.max(...ranks)}`,
      meanDmrs: roundMetric(dmrsMean),
      robust: top3 >= (options.robustTop3Threshold ?? 0.85),
      status: top1 >= 0.95
        ? "rank-locked"
        : top3 >= (options.robustTop3Threshold ?? 0.85)
          ? "top3-robust"
          : "sensitive",
    }
  }).sort((a, b) => a.meanRank - b.meanRank || b.top1Probability - a.top1Probability)

  validationAudit.changedWeightCount = validationAudit.changedWeights.size
  delete validationAudit.changedWeights
  const validation = validateSensitivityPerturbation(base, validationAudit, { perturbationRange })

  return {
    iterations,
    perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
    baseWeights: base,
    validation,
    summaries,
    targetMetal: summaries.find(row => row.metal === "Mo") || summaries[0] || null,
  }
}

export function runSensitivityAnalysis(metals, framework, baseWeights = DEFAULT_DOPANT_WEIGHTS, iterations = 1000, options = {}) {
  return runFullMetalSensitivityDistribution(metals, framework, baseWeights, iterations, options)
}

export function calculateDmrsDiagnostics(rankedMetals) {
  const rows = [...(rankedMetals || [])].sort((a, b) => (a.rank || 99) - (b.rank || 99))
  const leader = rows[0] || null
  const runnerUp = rows[1] || null
  const mo = rows.find(row => row.metal === "Mo") || null
  const closestToMo = mo
    ? rows.filter(row => row.metal !== "Mo").sort((a, b) => Math.abs((mo.dmrs || 0) - (a.dmrs || 0)) - Math.abs((mo.dmrs || 0) - (b.dmrs || 0)))[0]
    : null
  return {
    leaderMetal: leader?.metal || null,
    leaderDmrs: leader?.dmrs ?? null,
    runnerUpMetal: runnerUp?.metal || null,
    topMargin: leader && runnerUp ? roundMetric((leader.dmrs || 0) - (runnerUp.dmrs || 0)) : null,
    moRank: mo?.rank || null,
    moDmrs: mo?.dmrs ?? null,
    closestCompetitorToMo: closestToMo?.metal || null,
    moMarginToClosestCompetitor: mo && closestToMo ? roundMetric((mo.dmrs || 0) - (closestToMo.dmrs || 0)) : null,
    top5Spread: rows.length >= 5 ? roundMetric((rows[0]?.dmrs || 0) - (rows[4]?.dmrs || 0)) : null,
  }
}

export function auditMoRobustnessReason(sensitivityDistribution, rankedMetals) {
  const summaries = sensitivityDistribution?.summaries || sensitivityDistribution || []
  const mo = summaries.find(row => row.metal === "Mo") || null
  const diagnostics = calculateDmrsDiagnostics(rankedMetals)
  if (!mo) {
    return {
      status: "missing_mo",
      label: "Mo audit unavailable",
      reason: "Mo is not present in the configured metal pool.",
      recommendedAction: "Add Mo to the metal matrix before interpreting Mo robustness.",
    }
  }
  if (mo.top1Probability >= 1) {
    return {
      status: "audit_required",
      label: "robust but audit required",
      reason: "Mo rank is unchanged across all perturbations. This is robust under the demo descriptor set, but it requires an audit for descriptor saturation, source bias, and insufficient competitor variance; it is not definitive proof that Mo is optimal.",
      possibleCauses: [
        "Mo proxy descriptors may be saturated relative to W/V/Ti/Zr/Fe.",
        "Direct selected Al-MOF DFT and same-condition experimental evidence are pending.",
        "Risk descriptors may not yet capture leaching, aggregation, and speciation tradeoffs under 170C aqueous CO2.",
      ],
      recommendedAction: "Run descriptor ablation, direct DFT on the selected Al-MOF, and EXAFS/ICP-OES validation before treating Mo as more than a high-priority hypothesis.",
      top1Probability: mo.top1Probability,
      top3Probability: mo.top3Probability,
      closestCompetitor: diagnostics.closestCompetitorToMo,
      dmrsMarginToClosestCompetitor: diagnostics.moMarginToClosestCompetitor,
    }
  }
  if (mo.top3Probability >= 0.85) {
    return {
      status: "robust_hypothesis",
      label: "top3 robust hypothesis",
      reason: "Mo remains within the Top 3 for the configured perturbation distribution, but the result is still demo/proxy-level and not a final material-discovery conclusion.",
      recommendedAction: "Compare Mo against close competitors with direct descriptors and same-condition validation.",
      top1Probability: mo.top1Probability,
      top3Probability: mo.top3Probability,
      closestCompetitor: diagnostics.closestCompetitorToMo,
      dmrsMarginToClosestCompetitor: diagnostics.moMarginToClosestCompetitor,
    }
  }
  return {
    status: "sensitive",
    label: "sensitive hypothesis",
    reason: "Mo moves outside the Top 3 in a meaningful fraction of perturbations, so it should remain a hypothesis-generating candidate.",
    recommendedAction: "Inspect descriptor weights and collect direct evidence before prioritizing Mo.",
    top1Probability: mo.top1Probability,
    top3Probability: mo.top3Probability,
    closestCompetitor: diagnostics.closestCompetitorToMo,
    dmrsMarginToClosestCompetitor: diagnostics.moMarginToClosestCompetitor,
  }
}

function contributionMap(row) {
  return new Map((row?.contributionBreakdown || []).map(item => [item.key, item]))
}

function describeUncertainty(record) {
  const lowConfidence = METAL_DESCRIPTOR_KEYS
    .filter(key => ["low", "pending"].includes(String(descriptorConfidence(record?.[key])).toLowerCase()))
    .slice(0, 4)
  const missingDoiCount = METAL_DESCRIPTOR_KEYS.filter(key => !descriptorDoi(record?.[key])).length
  return {
    lowConfidenceDescriptors: lowConfidence,
    missingDoiCount,
    summary: missingDoiCount
      ? `${missingDoiCount}/${METAL_DESCRIPTOR_KEYS.length} descriptor DOI fields are evidence pending; low-confidence descriptors: ${lowConfidence.join(", ") || "none"}.`
      : "Descriptor DOI coverage is complete for the configured descriptor set.",
  }
}

export function compareCompetitiveMetals(rankedMetals, targetMetal = "Mo", competitors = COMPETITIVE_METALS) {
  const rows = rankedMetals || []
  const target = rows.find(row => row.metal === targetMetal)
  if (!target) return []
  const targetContributions = contributionMap(target)

  return competitors
    .map(metal => rows.find(row => row.metal === metal))
    .filter(Boolean)
    .map(competitor => {
      const competitorContributions = contributionMap(competitor)
      const sharedKeys = [...targetContributions.keys()].filter(key => competitorContributions.has(key))
      const targetWins = sharedKeys
        .map(key => {
          const targetItem = targetContributions.get(key)
          const competitorItem = competitorContributions.get(key)
          return {
            key,
            label: targetItem?.label || key,
            delta: roundMetric((targetItem?.value || 0) - (competitorItem?.value || 0)),
          }
        })
        .filter(item => item.delta > 0.004)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)
      const competitorWins = sharedKeys
        .map(key => {
          const targetItem = targetContributions.get(key)
          const competitorItem = competitorContributions.get(key)
          return {
            key,
            label: competitorItem?.label || key,
            delta: roundMetric((competitorItem?.value || 0) - (targetItem?.value || 0)),
          }
        })
        .filter(item => item.delta > 0.004)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)

      return {
        targetMetal,
        competitor: competitor.metal,
        targetRank: target.rank,
        competitorRank: competitor.rank,
        targetDmrs: target.dmrs,
        competitorDmrs: competitor.dmrs,
        dmrsGap: roundMetric((target.dmrs || 0) - (competitor.dmrs || 0)),
        targetWins,
        competitorWins,
        sharedUncertainty: {
          target: describeUncertainty(target.source),
          competitor: describeUncertainty(competitor.source),
        },
        dataStatus: {
          target: getDataStatusBadge(target.source),
          competitor: getDataStatusBadge(competitor.source),
        },
        note: competitor.source?.competitiveNote || "Demo/proxy-level competitive comparison; direct evidence is pending.",
      }
    })
}

export function calculateProvenanceCoverage(items, descriptorKeys = METAL_DESCRIPTOR_KEYS) {
  const rows = items || []
  const totalFields = rows.length * descriptorKeys.length
  const counts = {
    structuredValue: 0,
    sourceBasis: 0,
    confidence: 0,
    doiPresent: 0,
    doiMissing: 0,
    fakeDoi: 0,
  }
  const bySourceBasis = {}
  const byConfidence = {}
  const dataStatusCounts = {}

  rows.forEach(row => {
    const status = getDataStatusBadge(row)
    dataStatusCounts[status.level] = (dataStatusCounts[status.level] || 0) + 1
    descriptorKeys.forEach(key => {
      const field = row?.[key]
      if (field && typeof field === "object" && "value" in field) counts.structuredValue += 1
      const sourceBasis = descriptorSourceBasis(field)
      const confidence = descriptorConfidence(field)
      if (sourceBasis !== "pending") counts.sourceBasis += 1
      if (confidence !== "pending") counts.confidence += 1
      bySourceBasis[sourceBasis] = (bySourceBasis[sourceBasis] || 0) + 1
      byConfidence[confidence] = (byConfidence[confidence] || 0) + 1
      const doi = descriptorDoi(field)
      if (doi) {
        counts.doiPresent += 1
        if (!DOI_PATTERN.test(String(doi))) counts.fakeDoi += 1
      } else {
        counts.doiMissing += 1
      }
    })
  })

  return {
    itemCount: rows.length,
    descriptorFieldCount: totalFields,
    structuredValueCoverage: totalFields ? roundMetric(counts.structuredValue / totalFields) : 0,
    sourceBasisCoverage: totalFields ? roundMetric(counts.sourceBasis / totalFields) : 0,
    confidenceCoverage: totalFields ? roundMetric(counts.confidence / totalFields) : 0,
    doiCoverage: totalFields ? roundMetric(counts.doiPresent / totalFields) : 0,
    pendingDoiCount: counts.doiMissing,
    fakeDoiCount: counts.fakeDoi,
    noFakeDoiPolicyActive: counts.fakeDoi === 0,
    bySourceBasis,
    byConfidence,
    dataStatusCounts,
  }
}

export function generateExpectedEXAFSSignature(metal, mostLikelyForm) {
  if (String(metal?.metal || metal) !== "Mo") {
    return {
      technique: "metal-edge XANES/EXAFS",
      hypothesis: mostLikelyForm || "second-metal species pending",
      expectedFeatures: [],
      falsificationCriteria: ["Metal-edge signature must be generated after selecting a target metal."],
    }
  }

  return {
    technique: "Mo K-edge XANES/EXAFS",
    hypothesis: mostLikelyForm || "defect-anchored Mo-oxo species",
    expectedFeatures: [
      {
        feature: "Mo-O shell",
        expectedDistanceA: "1.7-1.9",
        interpretation: "terminal or distorted Mo=O / Mo-O coordination",
      },
      {
        feature: "Mo-O-Al or Mo-O-C scattering path",
        expectedIntensity: "weak-to-moderate",
        interpretation: "framework anchoring through Al-O or linker-related oxygen environment",
      },
      {
        feature: "Mo-Mo scattering path",
        expectedDistanceA: "2.5-3.0",
        expectedResult: "absent or very weak",
        interpretation: "rules out bulk MoOx / MoO3 aggregation",
      },
    ],
    falsificationCriteria: [
      "Strong Mo-Mo scattering at 2.5-3.0 A suggests MoOx aggregation.",
      "Loss of framework PXRD after reaction suggests Al-MOF collapse.",
      "High Mo concentration in filtrate suggests leaching-dominated behavior.",
    ],
  }
}

export function generateBlindBaselineSummary(metals) {
  return (metals || [])
    .filter(row => ["Ru", "Pd", "Ag"].includes(row.metal))
    .map(row => ({
      metal: row.metal,
      dmrs: row.dmrs,
      rank: row.rank,
      whyRankedLower: row.isNobleMetal
        ? "Blind baseline; noble-metal/cost penalty and weaker Al-O defect anchoring keep it below Mo."
        : "Blind baseline; weak oxo/formate priors and higher leaching risk keep it below Mo.",
      negativeEvidenceStatus: row.negativeEvidence?.sourceDoi
        ? "literature-linked"
        : "pending verification",
      sourceDoi: row.negativeEvidence?.sourceDoi || null,
      requiredEvidence: row.negativeEvidence?.requiredEvidence || [],
    }))
}

export function generateReproducibilityStatement() {
  return {
    en: "To ensure full reproducibility, the descriptor dictionary, CRITIC+AHP weighting configuration files, hydrothermal hard-gate rules, dopant-metal property matrix, blind-baseline metal list, and Monte Carlo sensitivity analysis scripts will be made publicly available upon publication or project release. All candidate-level decisions retain field-level provenance, including source database, record ID, descriptor origin, curation status, and evidence confidence.",
    zh: "为确保本筛选流程可复现，项目将在发布时公开描述符字典、CRITIC+AHP 组合赋权配置文件、水热稳定性硬阈值规则、掺杂金属属性矩阵、盲测基线金属列表以及蒙特卡洛敏感性分析脚本。所有候选材料的筛选决策均保留字段级溯源信息，包括来源数据库、记录 ID、描述符来源、整理状态和证据可信度。",
  }
}

export function runOrganicAcidFinalScreening(frameworkCandidates, metalMatrix, rules = {}) {
  const frameworkWeights = rules.frameworkWeights || DEFAULT_FRAMEWORK_WEIGHTS
  const dopantWeights = rules.dopantWeights || DEFAULT_DOPANT_WEIGHTS
  const gatedFrameworks = (frameworkCandidates || []).map(candidate => calculateOACS(
    applyHydrothermalGate(candidate, rules),
    frameworkWeights,
  ))
  const gateOrder = { pass: 0, needs_review: 1, fail: 2 }
  const rankedFrameworks = [...gatedFrameworks].sort((a, b) => {
    const gateDiff = (gateOrder[a.hydrothermalGate?.status] ?? 3) - (gateOrder[b.hydrothermalGate?.status] ?? 3)
    if (gateDiff !== 0) return gateDiff
    return (b.organicAcidScore?.oacs || 0) - (a.organicAcidScore?.oacs || 0)
  }).map((candidate, index) => ({ ...candidate, rank: index + 1 }))

  const selectedFramework = rankedFrameworks.find(candidate => candidate.hydrothermalGate?.status === "pass") || rankedFrameworks[0] || null
  const sensitivity = runSensitivityAnalysis(
    metalMatrix || [],
    selectedFramework,
    dopantWeights,
    rules.sensitivityAnalysis?.iterations || 1000,
    {
      perturbationRange: rules.sensitivityAnalysis?.perturbationRange ?? 0.2,
      robustTop3Threshold: rules.sensitivityAnalysis?.robustTop3Threshold ?? 0.85,
      seed: rules.sensitivityAnalysis?.seed ?? 170,
    },
  )
  const sensitivityByMetal = new Map((sensitivity.summaries || []).map(row => [row.metal, row]))
  const rankedMetals = (metalMatrix || [])
    .map(metal => calculateDMRS(metal, selectedFramework, dopantWeights))
    .sort((a, b) => b.dmrs - a.dmrs)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      sensitivity: sensitivityByMetal.get(row.metal) || null,
      sensitivityStatus: sensitivityByMetal.get(row.metal)?.status === "rank-locked"
        ? "robust but audit required"
        : sensitivityByMetal.get(row.metal)?.robust
          ? "robust recommendation"
          : "hypothesis-generating",
    }))

  const moRecommendation = rankedMetals.find(row => row.metal === "Mo") || null
  const dmrsDiagnostics = calculateDmrsDiagnostics(rankedMetals)
  const moRobustnessAudit = auditMoRobustnessReason(sensitivity, rankedMetals)
  const competitiveMetalComparison = compareCompetitiveMetals(
    rankedMetals,
    "Mo",
    rules.auditCompetitiveMetals || COMPETITIVE_METALS,
  )
  const provenanceCoverage = calculateProvenanceCoverage(
    metalMatrix || [],
    rules.provenanceDescriptorKeys || METAL_DESCRIPTOR_KEYS,
  )
  const hardGateSummary = rankedFrameworks.reduce((acc, row) => {
    const status = row.hydrothermalGate?.status || "pending"
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return {
    rules,
    rankedFrameworks,
    selectedFramework,
    rankedMetals,
    moRecommendation,
    sensitivity,
    fullMetalSensitivityDistribution: sensitivity.summaries || [],
    dmrsDiagnostics,
    moRobustnessAudit,
    competitiveMetalComparison,
    provenanceCoverage,
    blindBaselineSummary: generateBlindBaselineSummary(rankedMetals),
    exafsSignature: generateExpectedEXAFSSignature("Mo", moRecommendation?.mostLikelyForm),
    reproducibilityStatement: generateReproducibilityStatement(),
    hardGateSummary,
  }
}
