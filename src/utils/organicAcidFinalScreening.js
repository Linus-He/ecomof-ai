// @ts-nocheck
import { mapCuratedFrameworkExamples } from "./mofDataMappers/coreMofMapper"
import { attachRealEvidenceRecords } from "./mofDataMappers/literatureEvidenceMapper"
import { buildRealDataMappingReport, loadCuratedRealExamples } from "./mofDataMappers/mapperPreviewFixtures"
import { mergeQmofDescriptorsIntoFrameworks } from "./mofDataMappers/qmofMapper"
import { buildDatabaseIndexRunResultSummary, buildDatabaseIndexRunSteps, buildDatabaseIndexTrace } from "./databaseIndex/databaseIndexTraceAdapter"
import { ORGANIC_ACID_FEATURE_SCHEMA } from "./organicAcid/organicAcidFeatureSchema"
import { rankOrganicAcidCandidates } from "./organicAcid/rankOrganicAcidCandidates"
import { ORGANIC_ACID_TASK_DEFINITION } from "./organicAcid/organicAcidTaskDefinition"
import { buildRunTrace } from "./organicAcidTrace/traceEngine"

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

function percentile(values, ratio) {
  const valid = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
  if (!valid.length) return 0
  const index = Math.min(valid.length - 1, Math.max(0, Math.ceil(valid.length * ratio) - 1))
  return valid[index]
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
        reason: `No hydrothermal stability evidence at >=${minTemp} C.`,
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
        reason: `Hydrothermal evidence meets >=${minTemp} C threshold with post-treatment PXRD.`,
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
    const rankProbabilities = {
      rank1: roundMetric(ranks.filter(rank => rank === 1).length / Math.max(1, ranks.length)),
      rank2: roundMetric(ranks.filter(rank => rank === 2).length / Math.max(1, ranks.length)),
      rank3: roundMetric(ranks.filter(rank => rank === 3).length / Math.max(1, ranks.length)),
      rank4Plus: roundMetric(ranks.filter(rank => rank >= 4).length / Math.max(1, ranks.length)),
    }
    const rankCounts = {
      rank1: ranks.filter(rank => rank === 1).length,
      rank2: ranks.filter(rank => rank === 2).length,
      rank3: ranks.filter(rank => rank === 3).length,
      rank4Plus: ranks.filter(rank => rank >= 4).length,
    }
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
      rankCounts,
      rankProbabilities,
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

function normalizeEvidenceType(value) {
  return String(value || "pending_verification").replace(/-/g, "_").toLowerCase()
}

function normalizeEvidenceStatus(value) {
  return String(value || "pending_verification").replace(/-/g, "_").toLowerCase()
}

function evidenceRecordsForIds(ids, byId) {
  return [...new Set(ids || [])].map(id => byId.get(id)).filter(Boolean)
}

function attachEvidenceObjects(value, byId) {
  if (Array.isArray(value)) return value.map(item => attachEvidenceObjects(item, byId))
  if (!value || typeof value !== "object") return value
  const next = { ...value }
  Object.entries(next).forEach(([key, fieldValue]) => {
    if (key === "evidenceRecords") return
    next[key] = attachEvidenceObjects(fieldValue, byId)
  })
  if (Array.isArray(next.evidenceIds)) next.evidenceRecords = evidenceRecordsForIds(next.evidenceIds, byId)
  return next
}

export function loadEvidenceRecords(records = []) {
  return (Array.isArray(records) ? records : [])
    .filter(record => record && typeof record === "object" && record.id)
    .map(record => ({
      ...record,
      evidenceType: normalizeEvidenceType(record.evidenceType),
      status: normalizeEvidenceStatus(record.status),
      sourceDoi: record.sourceDoi || null,
      sourceTitle: record.sourceTitle || null,
      confidence: record.confidence || "pending",
      nextEvidenceNeeded: Array.isArray(record.nextEvidenceNeeded) ? record.nextEvidenceNeeded : [],
    }))
}

export function attachEvidenceToFrameworks(frameworks = [], evidenceRecords = []) {
  const byId = new Map(loadEvidenceRecords(evidenceRecords).map(record => [record.id, record]))
  return (frameworks || []).map(row => attachEvidenceObjects(row, byId))
}

export function attachEvidenceToMetals(metals = [], evidenceRecords = []) {
  const byId = new Map(loadEvidenceRecords(evidenceRecords).map(record => [record.id, record]))
  return (metals || []).map(row => attachEvidenceObjects(row, byId))
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

export function calculateEvidenceCoverage(evidenceRecords = []) {
  const records = loadEvidenceRecords(evidenceRecords)
  const total = records.length
  const byEvidenceType = {}
  const byStatus = {}
  const byConfidence = {}
  const byTargetModule = {}
  let doiPresent = 0
  let fakeDoi = 0

  records.forEach(record => {
    const type = normalizeEvidenceType(record.evidenceType)
    const status = normalizeEvidenceStatus(record.status)
    byEvidenceType[type] = (byEvidenceType[type] || 0) + 1
    byStatus[status] = (byStatus[status] || 0) + 1
    byConfidence[record.confidence || "pending"] = (byConfidence[record.confidence || "pending"] || 0) + 1
    byTargetModule[record.targetModule || "Unassigned"] = (byTargetModule[record.targetModule || "Unassigned"] || 0) + 1
    if (record.sourceDoi) {
      doiPresent += 1
      if (!DOI_PATTERN.test(String(record.sourceDoi))) fakeDoi += 1
    }
  })

  const doiCoverage = total ? roundMetric(doiPresent / total, 3) : 0
  return {
    totalRecords: total,
    verified: byStatus.verified || 0,
    literatureSupported: byEvidenceType.literature_supported || 0,
    literatureProxy: byEvidenceType.literature_proxy || 0,
    expertPrior: byEvidenceType.expert_prior || 0,
    pendingVerification: byEvidenceType.pending_verification || 0,
    statusPendingVerification: byStatus.pending_verification || 0,
    doiCoverage,
    doiCoveragePercent: `${Math.round(doiCoverage * 100)}%`,
    doiPresent,
    missingDoiCount: total - doiPresent,
    fakeDoiCount: fakeDoi,
    noFakeDoiPolicyActive: fakeDoi === 0,
    byEvidenceType,
    byStatus,
    byConfidence,
    byTargetModule,
    warning: doiCoverage === 0
      ? "Evidence layer is currently demo/proxy; no verified DOI-backed records yet."
      : "Evidence layer contains DOI-backed records; verify each source before upgrading confidence.",
  }
}

function evidenceSummaryFor(records, fallbackStatus = "pending") {
  const rows = records || []
  const confidenceScoreMap = { high: 3, verified: 3, "medium-high": 2.5, medium: 2, low: 1, pending: 0.5 }
  const avgConfidence = avg(rows.map(record => confidenceScoreMap[String(record.confidence || "pending").toLowerCase()] ?? 0.5))
  const confidence = avgConfidence >= 2.5 ? "high" : avgConfidence >= 1.8 ? "medium" : avgConfidence > 0 ? "low" : "pending"
  const type = rows.find(record => record.evidenceType === "literature_proxy")?.evidenceType ||
    rows.find(record => record.evidenceType === "expert_prior")?.evidenceType ||
    rows[0]?.evidenceType ||
    fallbackStatus
  return {
    evidenceType: type.replaceAll("_", " "),
    confidence,
    doiStatus: rows.some(record => record.sourceDoi) ? "DOI linked" : "DOI pending",
    recordIds: rows.map(record => record.id),
    nextEvidenceNeeded: [...new Set(rows.flatMap(record => record.nextEvidenceNeeded || []))].slice(0, 3),
  }
}

export function buildEvidenceStrengthMatrix(evidenceRecords = [], screeningResult = {}) {
  const records = loadEvidenceRecords(evidenceRecords)
  const select = predicate => records.filter(predicate)
  const mo = screeningResult?.moRecommendation || {}
  const w = (screeningResult?.rankedMetals || []).find(row => row.metal === "W") || {}
  const moWGap = mo.dmrs != null && w.dmrs != null ? roundMetric((mo.dmrs || 0) - (w.dmrs || 0)) : null
  const rows = [
    {
      descriptor: "Hydrothermal stability",
      descriptorZh: "水热稳定性",
      currentStatus: "demo proxy hard gate",
      currentStatusZh: "演示级硬阈值",
      records: select(record => ["hydrothermalEvidenceStrength", "postTreatmentPxrd"].includes(record.targetDescriptor)),
      nextEvidenceFallback: "150-170C water treatment + PXRD",
    },
    {
      descriptor: "OACS descriptors",
      descriptorZh: "OACS 描述符",
      currentStatus: "demo proxy",
      currentStatusZh: "演示级代理",
      records: select(record => record.targetModule === "OACS"),
      nextEvidenceFallback: "descriptor dictionary and scaffold evidence curation",
    },
    {
      descriptor: "CO2 activation",
      descriptorZh: "CO2 活化",
      currentStatus: "literature proxy",
      currentStatusZh: "文献代理",
      records: select(record => record.targetDescriptor === "co2ActivationPotential"),
      nextEvidenceFallback: "direct selected-framework DFT",
    },
    {
      descriptor: "Redox adaptability",
      descriptorZh: "氧化还原适应性",
      currentStatus: "literature proxy",
      currentStatusZh: "文献代理",
      records: select(record => record.targetDescriptor === "redoxAdaptability"),
      nextEvidenceFallback: "operando oxidation-state tracking",
    },
    {
      descriptor: "Formate affinity proxy",
      descriptorZh: "甲酸盐亲和力代理",
      currentStatus: "pending",
      currentStatusZh: "待验证",
      records: select(record => record.targetDescriptor === "formateAffinityProxy"),
      nextEvidenceFallback: "DFT adsorption energy",
    },
    {
      descriptor: "Leaching risk",
      descriptorZh: "浸出风险",
      currentStatus: "demo proxy",
      currentStatusZh: "演示级代理",
      records: select(record => ["leachingRisk", "leachingFalsification"].includes(record.targetDescriptor)),
      nextEvidenceFallback: "ICP-OES filtrate analysis",
    },
    {
      descriptor: "Mechanism feasibility",
      descriptorZh: "机制可行性",
      currentStatus: "hypothesis",
      currentStatusZh: "假设",
      records: select(record => ["mechanismFeasibility", "anchoringPath", "aggregationFalsification"].includes(record.targetDescriptor)),
      nextEvidenceFallback: "defect-site DFT + EXAFS path fitting",
    },
    {
      descriptor: "Mo-W gap",
      descriptorZh: "Mo-W 差距",
      currentStatus: moWGap == null ? "demo proxy" : `demo proxy gap ${moWGap}`,
      currentStatusZh: moWGap == null ? "演示级代理" : `演示级代理差距 ${moWGap}`,
      records: select(record => ["moWGap", "moVsWContribution", "moVsWUncertainty"].includes(record.targetDescriptor)),
      nextEvidenceFallback: "same-condition Mo/W comparison",
    },
    {
      descriptor: "Sensitivity result",
      descriptorZh: "敏感性结果",
      currentStatus: "robust but audit-required",
      currentStatusZh: "稳健但需审计",
      records: select(record => record.targetModule === "Sensitivity"),
      nextEvidenceFallback: "descriptor ablation and external calibration",
    },
    {
      descriptor: "EXAFS prediction",
      descriptorZh: "EXAFS 预测",
      currentStatus: "hypothesis",
      currentStatusZh: "结构假设",
      records: select(record => record.targetModule === "EXAFS"),
      nextEvidenceFallback: "Mo K-edge EXAFS",
    },
  ]

  return rows.map(row => {
    const summary = evidenceSummaryFor(row.records)
    return {
      descriptor: row.descriptor,
      descriptorZh: row.descriptorZh,
      currentStatus: row.currentStatus,
      currentStatusZh: row.currentStatusZh,
      evidenceType: summary.evidenceType,
      confidence: summary.confidence,
      doiStatus: summary.doiStatus,
      recordIds: summary.recordIds,
      nextEvidenceNeeded: summary.nextEvidenceNeeded.length ? summary.nextEvidenceNeeded : [row.nextEvidenceFallback],
    }
  })
}

export function buildMethodologyFlowData(rules = {}, screeningResult = {}) {
  const selected = screeningResult?.selectedFramework || {}
  const mo = screeningResult?.moRecommendation || {}
  return [
    {
      id: "reaction-constraint",
      title: "Reaction Constraint",
      titleZh: "反应约束",
      input: "CO2, aqueous phase, 170C, organic-acid target",
      inputZh: "CO2、水相、170C、有机酸目标",
      rule: "target-conditioned screening boundary",
      ruleZh: "目标条件化筛选边界",
      output: "Stage 1 candidate requirements",
      outputZh: "Stage 1 候选要求",
      evidenceStatus: "demo proxy",
      sectionId: "methodology-oafs-overview",
    },
    {
      id: "hydrothermal-hard-gate",
      title: "Hydrothermal Hard Gate",
      titleZh: "水热硬阈值",
      input: "Al-MOF candidates",
      inputZh: "Al-MOF 候选",
      rule: `>=${rules?.hydrothermalHardGate?.minimumTempC || DEFAULT_MIN_TEMP_C}C water stability + post-treatment PXRD`,
      ruleZh: `>=${rules?.hydrothermalHardGate?.minimumTempC || DEFAULT_MIN_TEMP_C}C 水热稳定性 + 处理后 PXRD`,
      output: `${screeningResult?.hardGateSummary?.pass || 0} pass / ${screeningResult?.hardGateSummary?.needs_review || 0} review / ${screeningResult?.hardGateSummary?.fail || 0} fail`,
      outputZh: `${screeningResult?.hardGateSummary?.pass || 0} 通过 / ${screeningResult?.hardGateSummary?.needs_review || 0} 复核 / ${screeningResult?.hardGateSummary?.fail || 0} 失败`,
      evidenceStatus: "demo proxy / pending",
      sectionId: "methodology-oafs-flow",
    },
    {
      id: "oacs-framework-ranking",
      title: "OACS Framework Ranking",
      titleZh: "OACS 骨架排序",
      input: "hard-gate pass scaffolds",
      inputZh: "通过硬阈值的骨架",
      rule: "weighted scaffold compatibility score",
      ruleZh: "加权骨架兼容性评分",
      output: selected.displayName || "selected scaffold pending",
      outputZh: selected.displayName || "选定骨架待定",
      evidenceStatus: "demo proxy",
      sectionId: "methodology-oafs-oacs",
    },
    {
      id: "dmrs-dopant-recommendation",
      title: "DMRS Dopant Recommendation",
      titleZh: "DMRS 第二金属推荐",
      input: `${screeningResult?.rankedMetals?.length || 0} metal pool`,
      inputZh: `${screeningResult?.rankedMetals?.length || 0} 个金属池`,
      rule: "active-site value + mechanism + aqueous stability - risk",
      ruleZh: "活性位价值 + 机制 + 水相稳定性 - 风险",
      output: `Mo #${mo.rank || "-"} as primary hypothesis; W remains backup`,
      outputZh: `Mo #${mo.rank || "-"} 为主要假设；W 保持备选`,
      evidenceStatus: "demo proxy / literature proxy",
      sectionId: "methodology-oafs-dmrs",
    },
    {
      id: "robustness-audit",
      title: "Robustness Audit",
      titleZh: "稳健性审计",
      input: "CRITIC+AHP weights",
      inputZh: "CRITIC+AHP 权重",
      rule: "+/-20%, 1000 iterations, full-metal reranking",
      ruleZh: "+/-20%，1000 次，全金属重排序",
      output: screeningResult?.moRobustnessAudit?.label || "audit pending",
      outputZh: screeningResult?.moRobustnessAudit?.label || "审计待定",
      evidenceStatus: "robust but audit-required",
      sectionId: "methodology-oafs-robustness",
    },
    {
      id: "exafs-falsification",
      title: "EXAFS Falsification",
      titleZh: "EXAFS 证伪",
      input: "defect-anchored Mo-oxo hypothesis",
      inputZh: "缺陷锚定 Mo-oxo 假设",
      rule: "Mo-O, Mo-O-Al / Mo-O-C, Mo-Mo signatures",
      ruleZh: "Mo-O、Mo-O-Al / Mo-O-C、Mo-Mo 信号",
      output: "confirmed or falsified structural hypothesis",
      outputZh: "确认或证伪结构假设",
      evidenceStatus: "pending verification",
      sectionId: "methodology-oafs-exafs",
    },
    {
      id: "experimental-controls",
      title: "Experimental Controls",
      titleZh: "实验对照",
      input: "five required control groups",
      inputZh: "五组必需对照",
      rule: "compare yield, carbon balance, framework retention, leaching",
      ruleZh: "比较产率、碳平衡、骨架保持、浸出",
      output: "same-condition validation loop",
      outputZh: "同条件验证闭环",
      evidenceStatus: "pending verification",
      sectionId: "methodology-oafs-validation-loop",
    },
  ]
}

export function buildFormulaCards(rules = {}) {
  return [
    {
      id: "oacs",
      title: "Stage 1 · Organic Acid Compatibility Score, OACS",
      titleZh: "Stage 1 · 有机酸兼容评分 OACS",
      math: "\\text{OACS}=w_1H_{\\text{hydrothermal}}+w_2S_{\\text{thermal}}+w_3R_{\\text{water-blocking}}+w_4A_{\\text{pore}}+w_5A_{\\text{C1}}+w_6R_{\\text{Al-O}}+w_7M_{\\text{linker}}+w_8C_{\\text{evidence}}-w_9R_{\\text{collapse}}",
      fallback: "OACS = w1 H_hydrothermal + w2 S_thermal + w3 R_water-blocking + w4 A_pore + w5 A_C1 + w6 R_Al-O + w7 M_linker + w8 C_evidence - w9 R_collapse",
      thresholdMath: "\\text{If HydrothermalGate}=\\text{fail},\\quad \\text{OACS}=0,\\quad R_{\\text{collapse}}=1",
      thresholdFallback: "If HydrothermalGate = fail, OACS = 0, R_collapse = 1",
      variables: [
        { symbol: "H_hydrothermal", meaning: ">=150C water stability evidence", meaningZh: ">=150C 水热稳定性证据", status: "demo proxy / pending" },
        { symbol: "A_pore", meaning: "pore accessibility", meaningZh: "孔道可达性", status: "descriptor" },
        { symbol: "A_C1", meaning: "C1 intermediate accessibility", meaningZh: "C1 中间体可达性", status: "descriptor" },
        { symbol: "R_Al-O", meaning: "Al-O framework robustness", meaningZh: "Al-O 骨架稳健性", status: "expert prior" },
        { symbol: "R_collapse", meaning: "collapse risk", meaningZh: "坍塌风险", status: "proxy" },
      ],
      interpretation: "High surface area cannot override a failed hydrothermal gate.",
      interpretationZh: "高比表面积不能抵消水热硬阈值失败。",
      weights: rules?.frameworkWeights || DEFAULT_FRAMEWORK_WEIGHTS,
    },
    {
      id: "dmrs",
      title: "Stage 2 · Dopant Metal Recommendation Score, DMRS",
      titleZh: "Stage 2 · 第二金属推荐评分 DMRS",
      math: "\\text{DMRS}=\\alpha V_{\\text{active-site}}+\\beta F_{\\text{mechanism}}+\\gamma S_{\\text{aqueous}}+\\delta E_{\\text{support}}-\\lambda R_{\\text{leaching/aggregation}}",
      fallback: "DMRS = alpha V_active-site + beta F_mechanism + gamma S_aqueous + delta E_support - lambda R_leaching/aggregation",
      thresholdMath: "F_{\\text{mechanism}}=\\max(F_{\\text{node-substitution}},F_{\\text{defect-anchoring}},F_{\\text{pore-confinement}})",
      thresholdFallback: "F_mechanism = max(F_node-substitution, F_defect-anchoring, F_pore-confinement)",
      variables: [
        { symbol: "V_active-site", meaning: "CO2 activation, redox and formate proxy", meaningZh: "CO2 活化、氧化还原与甲酸盐代理", status: "literature proxy" },
        { symbol: "F_mechanism", meaning: "best mechanism path score", meaningZh: "最佳机制路径评分", status: "hypothesis" },
        { symbol: "S_aqueous", meaning: "aqueous stability support", meaningZh: "水相稳定性支持", status: "demo proxy" },
        { symbol: "E_support", meaning: "descriptor evidence support", meaningZh: "描述符证据支持", status: "pending" },
        { symbol: "R_leaching/aggregation", meaning: "leaching and aggregation risk", meaningZh: "浸出与团聚风险", status: "pending" },
      ],
      interpretation: "Mo is not assumed to directly replace Al3+ nodes.",
      interpretationZh: "模型不默认假设 Mo 直接取代 Al3+ 节点。",
      weights: rules?.dopantWeights || DEFAULT_DOPANT_WEIGHTS,
    },
  ]
}

export function buildValidationLoopData(rules = {}) {
  const controls = rules?.requiredControls || [
    "Pure Al-MOF",
    "Mo-anchored Al-MOF",
    "Al-MOF + MoOx physical mixture",
    "MoOx alone",
    "Blank reaction",
  ]
  const purpose = {
    "Pure Al-MOF": ["baseline scaffold activity", "骨架本底活性"],
    "Mo-anchored Al-MOF": ["target hypothesis", "目标假设"],
    "Al-MOF + MoOx physical mixture": ["exclude free MoOx contribution", "排除游离 MoOx 贡献"],
    "MoOx alone": ["measure independent MoOx activity", "测量 MoOx 单独活性"],
    "Blank reaction": ["background reaction", "背景反应"],
  }
  return {
    controls: controls.map((name, index) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name,
      purpose: purpose[name]?.[0] || "control purpose pending",
      purposeZh: purpose[name]?.[1] || "对照目的待补充",
      step: index + 1,
    })),
    compare: ["formate yield", "carbon balance", "Mo leaching", "PXRD retention"],
    compareZh: ["甲酸产率", "碳平衡", "Mo 浸出", "PXRD 保持"],
    interpretation: "The loop separates anchored-site synergy, free MoOx contribution, scaffold-only activity, and background reaction.",
    interpretationZh: "闭环用于区分锚定位点协同、游离 MoOx 贡献、骨架单独活性和背景反应。",
  }
}

export function inferMetalRole(metal) {
  const symbol = typeof metal === "string" ? metal : metal?.metal
  if (symbol === "Mo") return "primary hypothesis"
  if (symbol === "W") return "backup hypothesis"
  if (["Ru", "Pd", "Ag"].includes(symbol)) return "blind baseline"
  return "competitive metal"
}

export function classifyHotSpotStatus(point = {}, region = {}) {
  const x = clamp01(point.x ?? point.frameworkRobustness)
  const y = clamp01(point.y ?? point.metalOxoActivity)
  const synergy = clamp01(point.synergyScore ?? point.colorValue)
  const inRegion = x >= (region.xMin ?? 0.65) && y >= (region.yMin ?? 0.65) && synergy >= (region.synergyMin ?? 0.6)
  const role = point.role || inferMetalRole(point.metal)
  if (point.gateStatus === "fail") return "rejected by hard gate"
  if (point.gateStatus === "needs_review") return "needs review"
  if (role === "primary hypothesis") return inRegion ? "primary hypothesis in hot spot" : "primary hypothesis near hot spot"
  if (role === "backup hypothesis") return inRegion ? "backup hypothesis in hot spot" : "backup hypothesis near hot spot"
  if (role === "blind baseline") return "blind baseline"
  return inRegion ? "competitive metal in hot spot" : "competitive metal"
}

export function calculateHotSpotRegion(points = []) {
  const rows = points || []
  const canUsePercentiles = rows.length >= 8
  const xMin = canUsePercentiles ? percentile(rows.map(point => point.x), 0.7) : 0.65
  const yMin = canUsePercentiles ? percentile(rows.map(point => point.y), 0.7) : 0.65
  const synergyMin = canUsePercentiles ? percentile(rows.map(point => point.synergyScore ?? point.colorValue), 0.75) : 0.6
  return {
    xMin: roundMetric(xMin),
    yMin: roundMetric(yMin),
    synergyMin: roundMetric(synergyMin),
    method: canUsePercentiles ? "percentile" : "demo_threshold",
    note: canUsePercentiles
      ? "Percentile threshold from current demo/proxy descriptor distribution."
      : "Demo/proxy threshold used until real descriptor calibration is available.",
    noteZh: canUsePercentiles
      ? "基于当前演示级代理描述符分布的百分位阈值。"
      : "真实描述符校准前使用演示级代理阈值。",
  }
}

export function buildScaffoldHotSpotData(frameworkCandidates = [], selectedScaffoldId = null) {
  return (frameworkCandidates || []).map(candidate => {
    const gateStatus = candidate?.hydrothermalGate?.status || "needs_review"
    const oacs = candidate?.organicAcidScore?.oacs
    const collapseRisk = candidate?.organicAcidScore?.collapseRisk ?? candidate?.descriptorScores?.collapseRisk
    const isSelected = Boolean(selectedScaffoldId && candidate?.id === selectedScaffoldId)
    return {
      id: candidate?.id || "pending-candidate",
      name: candidate?.displayName || "Pending candidate",
      x: roundMetric(candidate?.descriptorScores?.hydrothermalEvidenceStrength ?? 0),
      y: roundMetric(candidate?.descriptorScores?.c1IntermediateAccessibility ?? 0),
      colorValue: roundMetric(oacs ?? 0),
      oacs: Number.isFinite(Number(oacs)) ? roundMetric(oacs) : null,
      gateStatus,
      collapseRisk: Number.isFinite(Number(collapseRisk)) ? roundMetric(collapseRisk) : null,
      evidenceStatus: candidate?.dataStatus?.level || "demo_proxy",
      evidenceLabel: candidate?.dataStatus?.label || "Demo proxy",
      isSelected,
      status: isSelected ? "selected scaffold" : gateStatus,
      why: gateStatus === "pass"
        ? "Hydrothermal evidence and post-treatment PXRD pass the hard gate."
        : gateStatus === "needs_review"
          ? "High-temperature water stability is reported, but post-treatment PXRD evidence is missing."
          : "High surface area does not override hydrothermal failure.",
      whyZh: gateStatus === "pass"
        ? "水热证据与处理后 PXRD 通过硬阈值。"
        : gateStatus === "needs_review"
          ? "存在高温水相记录，但缺少处理后 PXRD 证据。"
          : "高比表面积不能抵消水热稳定性失败。",
    }
  })
}

export function buildDopantHotSpotData(rankedMetals = []) {
  return (rankedMetals || []).map(metal => {
    const role = inferMetalRole(metal)
    const dataStatus = metal?.dataStatus || {}
    return {
      metal: metal?.metal || "Pending metal",
      x: roundMetric(metal?.mechanism?.defectAnchoring?.score ?? 0),
      y: roundMetric(metal?.activeSiteValue ?? 0),
      colorValue: roundMetric(metal?.dmrs ?? 0),
      dmrs: roundMetric(metal?.dmrs ?? 0),
      rank: metal?.rank || 0,
      role,
      mostLikelyForm: metal?.mostLikelyForm || "mechanism pending review",
      mainStrength: metal?.mainStrength || "pending",
      mainRisk: metal?.mainRisk || "pending",
      dataStatus: dataStatus.level || "demo_proxy",
      evidenceStatus: dataStatus.label || "Demo proxy",
      isPrimary: role === "primary hypothesis",
      isBackup: role === "backup hypothesis",
      isBlindBaseline: role === "blind baseline",
    }
  })
}

export function buildSynergyHotSpotData(selectedScaffold, rankedMetals = []) {
  const frameworkRobustness = roundMetric(selectedScaffold?.descriptorScores?.hydrothermalEvidenceStrength ?? 0)
  return (rankedMetals || [])
    .filter(metal => ["Mo", "W", "V", "Fe", "Ti", "Zr"].includes(metal?.metal))
    .map(metal => {
      const metalOxoActivity = roundMetric(metal?.activeSiteValue ?? 0)
      const synergyScore = roundMetric(frameworkRobustness * (metal?.dmrs ?? 0))
      const role = inferMetalRole(metal)
      return {
        label: `Al-MOF@${metal?.metal || "Metal"}`,
        metal: metal?.metal || "Metal",
        x: frameworkRobustness,
        y: metalOxoActivity,
        frameworkRobustness,
        metalOxoActivity,
        synergyScore,
        colorValue: synergyScore,
        dmrs: roundMetric(metal?.dmrs ?? 0),
        role,
        hypothesis: metal?.metal === "Mo" ? "primary" : metal?.metal === "W" ? "backup" : "competitive",
        status: metal?.metal === "Mo"
          ? "Mo-anchored Al-MOF: primary hypothesis"
          : metal?.metal === "W"
            ? "W-anchored Al-MOF: backup hypothesis"
            : `${metal?.metal || "Metal"}-anchored Al-MOF: competitive hypothesis`,
        statusZh: metal?.metal === "Mo"
          ? "Mo 锚定 Al-MOF：主要假设"
          : metal?.metal === "W"
            ? "W 锚定 Al-MOF：备选假设"
            : `${metal?.metal || "Metal"} 锚定 Al-MOF：竞争假设`,
      }
    })
}

export function buildDescriptorCouplingData() {
  return [
    {
      pair: "Hydrothermal stability × Active-site value",
      pairZh: "水热稳定性 × 活性位点价值",
      interpretation: "Stable scaffold and active dopant must be jointly satisfied.",
      interpretationZh: "稳定骨架与活性第二金属必须同时满足。",
      status: "demo_proxy",
      statusZh: "演示级代理",
      nextEvidence: "Hydrothermal PXRD + DFT adsorption validation",
      nextEvidenceZh: "水热 PXRD + DFT 吸附能验证",
    },
    {
      pair: "Defect anchoring × Leaching risk",
      pairZh: "缺陷锚定 × 浸出风险",
      interpretation: "A high anchoring hypothesis must remain compatible with low leaching risk.",
      interpretationZh: "高锚定可行性必须同时满足低浸出风险。",
      status: "demo_proxy",
      statusZh: "演示级代理",
      nextEvidence: "Mo anchoring energy + ICP-OES filtrate analysis",
      nextEvidenceZh: "Mo 锚定能 + ICP-OES 滤液分析",
    },
    {
      pair: "Pore confinement × Aggregation risk",
      pairZh: "孔道限域 × 团聚风险",
      interpretation: "Confinement should suppress oxide aggregation rather than hide it.",
      interpretationZh: "孔道限域应抑制氧化物团聚，而不是掩盖团聚风险。",
      status: "hypothesis",
      statusZh: "假设",
      nextEvidence: "Post-reaction EXAFS + microscopy",
      nextEvidenceZh: "反应后 EXAFS + 显微表征",
    },
    {
      pair: "Formate affinity × Redox adaptability",
      pairZh: "甲酸盐亲和力 × 氧化还原适应性",
      interpretation: "C1 intermediate stabilization and redox flexibility must be interpreted together.",
      interpretationZh: "C1 中间体稳定与氧化还原灵活性需要共同解释。",
      status: "literature_proxy",
      statusZh: "文献代理",
      nextEvidence: "Formate adsorption DFT + operando oxidation-state tracking",
      nextEvidenceZh: "甲酸盐吸附 DFT + operando 氧化态追踪",
    },
    {
      pair: "Framework robustness × Metal-oxo activity",
      pairZh: "骨架稳健性 × 金属氧活性",
      interpretation: "The design hot spot requires robust Al-MOF support and favorable metal-oxo active-site value.",
      interpretationZh: "设计热区要求 Al-MOF 支撑稳健且金属氧活性位点价值较优。",
      status: "demo_proxy",
      statusZh: "演示级代理",
      nextEvidence: "Same-condition synthesis + Mo/W structural validation",
      nextEvidenceZh: "同条件合成 + Mo/W 结构验证",
    },
    {
      pair: "Evidence confidence × Ranking robustness",
      pairZh: "证据置信度 × 排名稳健性",
      interpretation: "Stable ranking is useful only when descriptor evidence is auditable.",
      interpretationZh: "只有描述符证据可审计时，稳定排名才具备解释价值。",
      status: "audit_required",
      statusZh: "需审计",
      nextEvidence: "Evidence curation + descriptor ablation",
      nextEvidenceZh: "证据整理 + 描述符消融",
    },
  ]
}

export function buildValidationEvidenceLadder() {
  return [
    {
      level: 1,
      title: "Demo proxy",
      titleZh: "演示级代理",
      status: "current",
      statusZh: "当前阶段",
      evidence: ["OACS ranking", "DMRS ranking"],
      evidenceZh: ["OACS 排序", "DMRS 排序"],
    },
    {
      level: 2,
      title: "Literature proxy",
      titleZh: "文献代理",
      status: "partial / pending",
      statusZh: "部分 / 待补",
      evidence: ["Mo-oxo analogues", "W-oxo analogues"],
      evidenceZh: ["Mo-oxo 类比", "W-oxo 类比"],
    },
    {
      level: 3,
      title: "DFT validation",
      titleZh: "DFT 验证",
      status: "pending",
      statusZh: "待验证",
      evidence: ["formate adsorption energy", "Al-O BDE", "Mo anchoring energy"],
      evidenceZh: ["甲酸盐吸附能", "Al-O BDE", "Mo 锚定能"],
    },
    {
      level: 4,
      title: "Spectroscopy validation",
      titleZh: "谱学验证",
      status: "pending",
      statusZh: "待验证",
      evidence: ["Mo K-edge EXAFS", "ICP-OES", "PXRD after reaction"],
      evidenceZh: ["Mo K-edge EXAFS", "ICP-OES", "反应后 PXRD"],
    },
    {
      level: 5,
      title: "Reaction performance",
      titleZh: "反应性能",
      status: "pending",
      statusZh: "待验证",
      evidence: ["170C aqueous CO2-to-formate test", "HPLC / IC quantification"],
      evidenceZh: ["170C 水相 CO2 到甲酸测试", "HPLC / IC 定量"],
    },
  ]
}

export function buildAlgorithmJourneySteps(screeningResult) {
  const audit = screeningResult?.moRobustnessAudit || {}
  const hasSelectedFramework = Boolean(screeningResult?.selectedFramework)
  const hasMo = Boolean(screeningResult?.moRecommendation)
  const hasExafs = Boolean(screeningResult?.exafsSignature?.expectedFeatures?.length)
  const gateStatus = hasSelectedFramework && screeningResult?.selectedFramework?.hydrothermalGate?.status === "pass" ? "completed" : "blocked"
  const auditStatus = audit.status === "audit_required" ? "warning" : audit.status ? "completed" : "pending"

  return [
    {
      id: "reaction-constraints",
      step: "01",
      title: "Reaction Constraints",
      titleZh: "反应约束",
      status: "completed",
      linkedSectionId: "organic-acid-final-constraints",
      description: "170C aqueous CO2 to formic acid / organic acids constraint.",
      descriptionZh: "170C 水相 CO2 到甲酸 / 有机酸约束。",
    },
    {
      id: "hydrothermal-gate",
      step: "02",
      title: "Hydrothermal Gate",
      titleZh: "水热硬阈值",
      status: gateStatus,
      linkedSectionId: "organic-acid-final-framework-ranking",
      description: `${screeningResult?.hardGateSummary?.pass || 0} pass, ${screeningResult?.hardGateSummary?.needs_review || 0} needs review, ${screeningResult?.hardGateSummary?.fail || 0} rejected by hard gate.`,
      descriptionZh: `${screeningResult?.hardGateSummary?.pass || 0} 通过，${screeningResult?.hardGateSummary?.needs_review || 0} 待复核，${screeningResult?.hardGateSummary?.fail || 0} 被硬阈值拦截。`,
    },
    {
      id: "oacs-framework-ranking",
      step: "03",
      title: "OACS Framework Ranking",
      titleZh: "OACS 骨架排序",
      status: hasSelectedFramework ? "completed" : "pending",
      linkedSectionId: "organic-acid-final-framework-ranking",
      description: `${screeningResult?.selectedFramework?.displayName || "Selected scaffold pending"} selected among pass candidates.`,
      descriptionZh: `${screeningResult?.selectedFramework?.displayName || "选定骨架待定"} 从通过候选中选出。`,
    },
    {
      id: "dmrs-dopant-recommendation",
      step: "04",
      title: "DMRS Dopant Recommendation",
      titleZh: "DMRS 第二金属推荐",
      status: hasMo ? "completed" : "pending",
      linkedSectionId: "organic-acid-final-dopant-matrix",
      description: `${screeningResult?.rankedMetals?.length || 0} metals evaluated; Mo and W remain high-priority hypotheses.`,
      descriptionZh: `评估 ${screeningResult?.rankedMetals?.length || 0} 个金属；Mo 与 W 保持高优先级假设。`,
    },
    {
      id: "robustness-audit",
      step: "05",
      title: "Robustness Audit",
      titleZh: "稳健性审计",
      status: auditStatus,
      linkedSectionId: "organic-acid-final-robustness-audit",
      description: audit.label || "Sensitivity audit pending.",
      descriptionZh: audit.label || "敏感性审计待定。",
    },
    {
      id: "exafs-falsification",
      step: "06",
      title: "EXAFS Falsification",
      titleZh: "EXAFS 可证伪预测",
      status: hasExafs ? "warning" : "pending",
      linkedSectionId: "organic-acid-final-exafs",
      description: "Mo K-edge EXAFS is required to validate or falsify the structure hypothesis.",
      descriptionZh: "必须用 Mo K-edge EXAFS 验证或证伪结构假设。",
    },
    {
      id: "experimental-controls",
      step: "07",
      title: "Experimental Controls",
      titleZh: "实验对照验证",
      status: "pending",
      linkedSectionId: "organic-acid-final-validation-roadmap",
      description: "Pure Al-MOF, Mo-anchored Al-MOF, physical mixture, MoOx alone, and blank controls remain required.",
      descriptionZh: "仍需纯 Al-MOF、Mo 锚定 Al-MOF、物理混合物、MoOx 单独和空白对照。",
    },
  ]
}

export function buildScreeningFunnelData(frameworks, rankedMetals, selectedScaffold) {
  const rows = frameworks || []
  const passCount = rows.filter(row => row?.hydrothermalGate?.status === "pass").length
  const reviewCount = rows.filter(row => row?.hydrothermalGate?.status === "needs_review").length
  const failCount = rows.filter(row => row?.hydrothermalGate?.status === "fail").length
  return [
    {
      id: "raw-demo-framework-pool",
      label: "Raw demo framework pool",
      labelZh: "原始演示骨架池",
      count: rows.length,
      status: "completed",
      description: "Demo Al-MOF framework pool before hard-gate filtering.",
      descriptionZh: "进入硬阈值前的演示级 Al-MOF 骨架池。",
    },
    {
      id: "al-mof-candidates",
      label: "Al-MOF candidates",
      labelZh: "Al-MOF 候选",
      count: rows.length,
      status: "completed",
      description: "Stage 1 only screens Al-MOF stable scaffolds.",
      descriptionZh: "Stage 1 只筛选 Al-MOF 稳定骨架。",
    },
    {
      id: "hydrothermal-gate-pass",
      label: "Hydrothermal gate pass",
      labelZh: "水热硬阈值通过",
      count: passCount,
      status: "completed",
      reviewCount,
      failCount,
      description: `${reviewCount} need review and ${failCount} are rejected by hard gate.`,
      descriptionZh: `${reviewCount} 个待复核，${failCount} 个被硬阈值拦截。`,
    },
    {
      id: "oacs-ranked-candidates",
      label: "OACS-ranked candidates",
      labelZh: "OACS 排序候选",
      count: passCount,
      status: "completed",
      description: "Only hard-gate pass candidates enter OACS ranking.",
      descriptionZh: "只有通过硬阈值的候选进入 OACS 排序。",
    },
    {
      id: "selected-scaffold",
      label: "Selected scaffold",
      labelZh: "选定骨架",
      count: selectedScaffold ? 1 : 0,
      status: selectedScaffold ? "completed" : "pending",
      action: "openCandidateDecisionDrawer",
      candidateId: selectedScaffold?.id || null,
      description: selectedScaffold?.displayName || "Selected scaffold pending.",
      descriptionZh: selectedScaffold?.displayName || "选定骨架待定。",
    },
    {
      id: "dopant-metals-evaluated",
      label: "Dopant metals evaluated",
      labelZh: "评估第二金属",
      count: rankedMetals?.length || 0,
      status: "completed",
      description: "DMRS evaluates the configured second-metal pool.",
      descriptionZh: "DMRS 评估配置的第二金属池。",
    },
    {
      id: "high-priority-dopants",
      label: "High-priority dopants",
      labelZh: "高优先级第二金属",
      count: 2,
      status: "warning",
      action: "jumpToMoW",
      description: "Mo / W. W remains a strong alternative dopant rather than a rejected candidate.",
      descriptionZh: "Mo / W。W 是强竞争备选金属，而不是被简单排除的候选。",
    },
    {
      id: "experimental-hypothesis",
      label: "Experimental hypothesis",
      labelZh: "实验假设",
      count: 1,
      status: "pending",
      description: "Mo-anchored Al-MOF remains a falsifiable hypothesis.",
      descriptionZh: "Mo 锚定 Al-MOF 仍是可证伪假设。",
    },
  ]
}

export function buildStageSummary(screeningResult, frameworkRows = []) {
  const frameworks = frameworkRows.length ? frameworkRows : screeningResult?.rankedFrameworks || []
  const selected = screeningResult?.selectedFramework || {}
  const mo = screeningResult?.moRecommendation || {}
  const w = (screeningResult?.rankedMetals || []).find(row => row.metal === "W") || {}
  const summary = screeningResult?.hardGateSummary || {}
  return {
    stage1: {
      title: "Stage 1 · Stable Al-MOF Framework Mining",
      titleZh: "第一阶段 · 稳定 Al-MOF 骨架筛选",
      input: `${frameworks.length} Al-MOF candidates`,
      inputZh: `${frameworks.length} 个 Al-MOF 候选`,
      hardGate: ">=150C water stability + post-treatment PXRD",
      hardGateZh: ">=150C 水热稳定性 + 处理后 PXRD",
      passReviewFail: `${summary.pass || 0} / ${summary.needs_review || 0} / ${summary.fail || 0}`,
      selectedScaffold: selected.displayName || "Pending",
      oacs: selected.organicAcidScore?.oacs ?? null,
      status: "Demo proxy",
      statusZh: "演示级代理评分",
    },
    stage2: {
      title: "Stage 2 · Dopant Metal Recommendation",
      titleZh: "第二阶段 · 第二金属推荐",
      input: `${screeningResult?.rankedMetals?.length || 0} candidate metals`,
      inputZh: `${screeningResult?.rankedMetals?.length || 0} 个候选金属`,
      mechanismPaths: "node substitution / defect anchoring / pore confinement",
      mechanismPathsZh: "节点取代 / 缺陷锚定 / 孔道限域",
      topDopants: `Mo #${mo.rank || "-"}, W #${w.rank || "-"}`,
      moWGap: mo.dmrs != null && w.dmrs != null ? roundMetric((mo.dmrs || 0) - (w.dmrs || 0)) : null,
      moForm: mo.mostLikelyForm || "defect-anchored Mo-oxo species",
      status: screeningResult?.moRobustnessAudit?.label || "robust but audit-required",
      statusZh: screeningResult?.moRobustnessAudit?.label || "robust but audit-required",
    },
  }
}

export function buildCandidateDecisionTrace(candidate) {
  const status = candidate?.hydrothermalGate?.status || "pending"
  const oacs = candidate?.organicAcidScore?.oacs ?? 0
  const base = {
    candidateId: candidate?.id || null,
    candidateName: candidate?.displayName || "Pending candidate",
    gateStatus: status,
    decision: status === "pass" ? "passed" : status === "needs_review" ? "needs_review" : status === "fail" ? "failed" : "pending",
    oacs,
    oacsContribution: candidate?.organicAcidScore?.contributionBreakdown || {},
    dataStatus: getDataStatusBadge(candidate),
    fieldProvenance: {
      sourceDatabase: candidate?.sourceDatabase || "Pending provenance",
      sourceRecordId: candidate?.sourceRecordId || "Pending provenance",
      waterStability: candidate?.waterStability || {},
      fieldSources: candidate?.fieldSources || {},
    },
    reasons: [],
    penalties: [],
  }

  if (status === "pass") {
    base.reasons = [
      ">=150C hydrothermal evidence",
      "post-treatment PXRD retained",
      "C1 intermediate accessibility acceptable",
      "collapse risk below threshold",
    ]
    base.reasonsZh = [
      "具备 >=150C 水热证据",
      "处理后 PXRD 保持",
      "C1 中间体可达性可接受",
      "坍塌风险低于阈值",
    ]
  } else if (status === "needs_review") {
    base.reasons = [
      "High-temperature water stability is reported",
      "post-treatment PXRD evidence is missing",
      "OACS forced to 0 until evidence is reviewed",
    ]
    base.reasonsZh = [
      "存在高温水相记录",
      "缺少处理后 PXRD 证据",
      "证据复核前 OACS 强制为 0",
    ]
    base.penalties = ["OACS forced to 0", "Missing PXRD blocks final recommendation"]
    base.penaltiesZh = ["OACS forced to 0", "缺少 PXRD 会阻断最终推荐"]
  } else if (status === "fail") {
    base.reasons = [
      "no >=150C water stability evidence",
      "no post-treatment PXRD",
      "OACS forced to 0",
      "High surface area does not override hydrothermal failure.",
    ]
    base.reasonsZh = [
      "缺少 >=150C 水稳定性证据",
      "缺少处理后 PXRD",
      "OACS forced to 0",
      "高比表面积不能抵消水热稳定性失败。",
    ]
    base.penalties = ["Rejected by hard gate", "High surface area does not override hydrothermal failure."]
    base.penaltiesZh = ["被硬阈值拦截", "高比表面积不能抵消水热稳定性失败。"]
  }

  return base
}

export function buildMechanismRadarData(rankedMetals) {
  const keep = new Set(["Mo", "W", "V", "Fe", "Ti", "Zr"])
  return (rankedMetals || [])
    .filter(row => keep.has(row.metal))
    .map(row => ({
      metal: row.metal,
      nodeSubstitution: row.mechanism?.nodeSubstitution?.score ?? 0,
      defectAnchoring: row.mechanism?.defectAnchoring?.score ?? 0,
      poreConfinement: row.mechanism?.poreConfinement?.score ?? 0,
      activeSiteValue: row.activeSiteValue ?? 0,
      aqueousStability: row.aqueousStability ?? 0,
      riskControl: round3(1 - (row.riskPenalty ?? 0)),
      rank: row.rank,
      dmrs: row.dmrs,
    }))
}

export function buildSensitivityRankBars(distribution) {
  const rows = distribution?.summaries || distribution || []
  return rows.map(item => {
    const rankProbabilities = item.rankProbabilities || {
      rank1: item.top1Probability || 0,
      rank2: 0,
      rank3: Math.max(0, (item.top3Probability || 0) - (item.top1Probability || 0)),
      rank4Plus: Math.max(0, 1 - (item.top3Probability || 0)),
    }
    return {
      metal: item.metal,
      rankProbabilities,
      top3Probability: item.top3Probability || 0,
      meanRank: item.meanRank,
      rankRange: item.rankRange || `${item.minRank}-${item.maxRank}`,
      status: item.top3Probability >= 0.85
        ? "Robust high-priority"
        : item.top3Probability >= 0.5
          ? "Competitive / sensitive"
          : "Lower-priority under perturbation",
      statusZh: item.top3Probability >= 0.85
        ? "稳健高优先级"
        : item.top3Probability >= 0.5
          ? "竞争性 / 敏感"
          : "扰动下低优先级",
    }
  })
}

export function buildAlgorithmTrace(screeningResult) {
  const selected = screeningResult?.selectedFramework || {}
  const mo = screeningResult?.moRecommendation || {}
  const w = (screeningResult?.rankedMetals || []).find(row => row.metal === "W") || {}
  const gap = mo.dmrs != null && w.dmrs != null ? roundMetric((mo.dmrs || 0) - (w.dmrs || 0)) : null
  const signature = screeningResult?.exafsSignature || {}
  const controls = screeningResult?.rules?.requiredControls || [
    "Pure Al-MOF",
    "Mo-anchored Al-MOF",
    "Al-MOF + MoOx physical mixture",
    "MoOx alone",
    "Blank reaction",
  ]

  return [
    {
      id: "reaction-constraint",
      title: "Reaction constraint",
      titleZh: "反应约束",
      detail: "170C aqueous CO2 to formic acid / organic acids",
      detailZh: "170C 水相 CO2 到甲酸 / 有机酸",
    },
    {
      id: "framework-gate",
      title: "Framework gate",
      titleZh: "骨架硬阈值",
      detail: `${selected.displayName || "Selected Al-MOF"} passed >=150C hydrothermal gate and post-treatment PXRD requirement.`,
      detailZh: `${selected.displayName || "选定 Al-MOF"} 通过 >=150C 水热硬阈值和处理后 PXRD 要求。`,
    },
    {
      id: "oacs-result",
      title: "OACS result",
      titleZh: "OACS 结果",
      detail: `OACS = ${selected.organicAcidScore?.oacs ?? "Pending"}, selected among pass candidates.`,
      detailZh: `OACS = ${selected.organicAcidScore?.oacs ?? "Pending"}，从通过候选中选定。`,
    },
    {
      id: "dopant-screening",
      title: "Dopant screening",
      titleZh: "第二金属筛选",
      detail: `${screeningResult?.rankedMetals?.length || 0} metals evaluated through DMRS.`,
      detailZh: `${screeningResult?.rankedMetals?.length || 0} 个金属通过 DMRS 评估。`,
    },
    {
      id: "mo-vs-w",
      title: "Mo vs W result",
      titleZh: "Mo vs W 结果",
      detail: `Mo = ${mo.dmrs ?? "Pending"}, W = ${w.dmrs ?? "Pending"}, gap = ${gap ?? "Pending"}.`,
      detailZh: `Mo = ${mo.dmrs ?? "Pending"}，W = ${w.dmrs ?? "Pending"}，差距 = ${gap ?? "Pending"}。`,
    },
    {
      id: "mechanism-inference",
      title: "Mechanism inference",
      titleZh: "机制推断",
      detail: `Mo is not assumed to replace Al3+. Most likely form: ${mo.mostLikelyForm || "defect-anchored Mo-oxo species"}.`,
      detailZh: `不假设 Mo 直接取代 Al3+。最可能形态：${mo.mostLikelyForm || "defect-anchored Mo-oxo species"}。`,
    },
    {
      id: "robustness-audit",
      title: "Robustness audit",
      titleZh: "稳健性审计",
      detail: `Mo Top1 ${Math.round((screeningResult?.sensitivity?.targetMetal?.top1Probability || 0) * 100)}%, Top3 ${Math.round((screeningResult?.sensitivity?.targetMetal?.top3Probability || 0) * 100)}%. Status: ${screeningResult?.moRobustnessAudit?.label || "pending"}.`,
      detailZh: `Mo Top1 ${Math.round((screeningResult?.sensitivity?.targetMetal?.top1Probability || 0) * 100)}%，Top3 ${Math.round((screeningResult?.sensitivity?.targetMetal?.top3Probability || 0) * 100)}%。状态：${screeningResult?.moRobustnessAudit?.label || "pending"}。`,
    },
    {
      id: "falsifiable-hypothesis",
      title: "Falsifiable hypothesis",
      titleZh: "可证伪假设",
      detail: `Expected ${signature.technique || "Mo K-edge EXAFS"}: Mo-O 1.7-1.9 A, weak Mo-O-Al / Mo-O-C, weak or absent Mo-Mo.`,
      detailZh: `预期 ${signature.technique || "Mo K-edge EXAFS"}：Mo-O 1.7-1.9 A，弱 Mo-O-Al / Mo-O-C，弱或无 Mo-Mo。`,
    },
    {
      id: "required-controls",
      title: "Required controls",
      titleZh: "必需对照",
      detail: controls.join(" / "),
      detailZh: controls.join(" / "),
      items: controls,
    },
  ]
}

function curatedQualityRank(status) {
  if (status === "ready_for_scoring") return 0
  if (status === "needs_review") return 1
  if (status === "rejected") return 2
  return 3
}

function buildCuratedHotSpotPoints(frameworks = [], selectedId = null) {
  return buildScaffoldHotSpotData(frameworks, selectedId).map(point => {
    const source = frameworks.find(row => row.id === point.id) || {}
    const quality = source.dataQualityGate || {}
    const sourceDoi = source.sourceDoi || source.fieldSources?.sourceDatabase?.sourceDoi || null
    return {
      ...point,
      dataMode: "curated_real_examples",
      dataModeLabel: "Curated real example",
      sourceDatabase: source.sourceDatabase || "curated source",
      sourceRecordId: source.sourceRecordId || "pending",
      sourceUrl: source.sourceUrl || null,
      sourceDoi,
      doiStatus: sourceDoi ? "DOI verified" : "DOI pending",
      fieldSources: source.fieldSources || {},
      dataQualityGate: quality.status || "needs_review",
      dataQualityGateLabel: quality.label || "Needs review",
      dataQualityReason: quality.reason || "Curated sample needs provenance review before scoring.",
      canEnterScoring: Boolean(quality.canEnterScoring),
      qmofDescriptorStatus: source.qmofDescriptorStatus || "pending",
      hydrothermalEvidenceStatus: point.gateStatus || "pending",
      status: quality.status === "ready_for_scoring"
        ? (point.isSelected ? "selected curated example" : "curated real example")
        : quality.status === "rejected"
          ? "rejected by hard gate"
          : "needs review",
      why: quality.canEnterScoring
        ? "Curated sample passed the V1.6 data quality gate and hydrothermal preview gate."
        : quality.reason || point.why,
      whyZh: quality.canEnterScoring
        ? "该人工整理样例通过 V1.6 数据质量门与水热预览门槛。"
        : quality.reasonZh || point.whyZh,
    }
  })
}

export function buildCuratedRealScreeningResult(curatedRealExamples = null, metalMatrix = [], rules = {}) {
  const source = curatedRealExamples?.frameworks ? curatedRealExamples : loadCuratedRealExamples()
  const mappedFrameworks = mapCuratedFrameworkExamples(source.frameworks || [])
  const qmofMerge = mergeQmofDescriptorsIntoFrameworks(mappedFrameworks, source.qmofDescriptors || [])
  const evidenceAttachment = attachRealEvidenceRecords(qmofMerge.frameworks, source.evidenceRecords || [])
  const frameworkWeights = rules.frameworkWeights || DEFAULT_FRAMEWORK_WEIGHTS

  const evaluatedFrameworks = evidenceAttachment.frameworks.map(framework => {
    const gated = applyHydrothermalGate(framework, rules)
    const gatePass = gated.hydrothermalGate?.status === "pass"
    const canScore = Boolean(framework.dataQualityGate?.canEnterScoring && gatePass)
    const scored = canScore ? calculateOACS(gated, frameworkWeights) : gated
    return {
      ...scored,
      dataQualityGate: {
        ...(framework.dataQualityGate || {}),
        canEnterScoring: canScore,
        hydrothermalGateStatus: gated.hydrothermalGate?.status || "pending",
      },
      organicAcidScore: canScore
        ? scored.organicAcidScore
        : {
          ...(scored.organicAcidScore || {}),
          oacs: null,
          collapseRisk: roundMetric(framework.descriptorScores?.collapseRisk ?? 1),
          evidenceLevel: framework.dataQualityGate?.status === "rejected" ? "rejected" : "needs_review",
          weightingMethod: "CRITIC+AHP",
        },
      curatedRunStatus: canScore ? "scored_preview" : framework.dataQualityGate?.status || "needs_review",
      finalRecommendationEligible: canScore,
    }
  })

  const rankedFrameworks = [...evaluatedFrameworks]
    .sort((a, b) => {
      const qualityDiff = curatedQualityRank(a.dataQualityGate?.status) - curatedQualityRank(b.dataQualityGate?.status)
      if (qualityDiff !== 0) return qualityDiff
      return (b.organicAcidScore?.oacs || 0) - (a.organicAcidScore?.oacs || 0)
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))

  const selectedFramework = rankedFrameworks.find(row => row.finalRecommendationEligible) || null
  const mappingReport = buildRealDataMappingReport(
    rankedFrameworks,
    source.qmofDescriptors || [],
    evidenceAttachment.evidenceRecords,
    source.mappingReport || {},
    qmofMerge.unmatchedRecords,
  )
  const scaffoldHotSpotData = buildCuratedHotSpotPoints(rankedFrameworks, selectedFramework?.id || null)
  const summary = {
    dataMode: "curated_real_examples",
    runType: "Small curated sample validation",
    frameworkRecords: mappingReport.frameworkRecords,
    qmofDescriptorRecords: mappingReport.qmofDescriptorRecords,
    evidenceRecords: mappingReport.evidenceRecords,
    readyForScoring: mappingReport.readyForScoring,
    needsReview: mappingReport.needsReview,
    rejected: mappingReport.rejected,
    unmatchedQmofDescriptorRecords: mappingReport.unmatchedQmofDescriptorRecords,
    doiCoverage: mappingReport.doiCoverage,
    fieldProvenanceCoverage: mappingReport.fieldProvenanceCoverage,
    hotSpotProjectionStatus: mappingReport.hotSpotProjectionStatus,
    evidenceBoundary: mappingReport.boundary,
    evidenceBoundaryZh: mappingReport.boundaryZh,
    selectedScaffold: selectedFramework?.displayName || "No curated final recommendation",
    oacs: selectedFramework?.organicAcidScore?.oacs ?? null,
  }

  return {
    status: "completed",
    datasetMode: "curated_real_examples",
    dataMode: "curated_real_examples",
    version: "V1.6",
    rules,
    metalMatrix,
    curatedFrameworks: rankedFrameworks,
    rankedFrameworks,
    selectedFramework,
    evidenceRecords: evidenceAttachment.evidenceRecords,
    mappingReport,
    summary,
    provenanceCoverage: {
      coverage: mappingReport.fieldProvenanceCoverage,
      doiCoverage: mappingReport.doiCoverage,
      verifiedCount: 0,
      totalRecords: mappingReport.frameworkRecords,
      status: "curated_sample_pending_verification",
    },
    scaffoldHotSpotData,
    hotSpotProjectionData: scaffoldHotSpotData,
    unmatchedQmofRecords: qmofMerge.unmatchedRecords,
    evidenceCoverage: calculateEvidenceCoverage(evidenceAttachment.evidenceRecords),
    hardGateSummary: rankedFrameworks.reduce((acc, row) => {
      const status = row.hydrothermalGate?.status || "pending"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}),
  }
}

function buildCuratedRunSteps(screeningResult = {}) {
  const report = screeningResult.mappingReport || screeningResult.summary || {}
  const ready = report.readyForScoring || 0
  const needsReview = report.needsReview || 0
  const rejected = report.rejected || 0
  const totalFrameworks = report.frameworkRecords || (screeningResult.curatedFrameworks || []).length || 0
  const qmofRecords = report.qmofDescriptorRecords || 0
  const evidenceRecords = report.evidenceRecords || 0

  return [
    {
      id: "load-curated-framework-examples",
      step: 1,
      title: "Load curated framework examples",
      titleZh: "加载人工整理骨架样例",
      status: "completed",
      inputCount: totalFrameworks,
      outputCount: totalFrameworks,
      decision: "Small curated sample loaded. Not full database screening.",
      decisionZh: "已加载小规模人工整理样例；不是全量数据库筛选。",
      linkedSectionId: "organic-acid-final-run-launcher",
    },
    {
      id: "validate-curated-schema",
      step: 2,
      title: "Validate schema",
      titleZh: "验证 schema",
      status: "completed",
      inputCount: totalFrameworks,
      outputCount: totalFrameworks,
      decision: "Curated records mapped into the Organic Acid screening shape.",
      decisionZh: "人工整理记录已映射到有机酸筛选数据形状。",
      linkedSectionId: "organic-acid-final-provenance",
    },
    {
      id: "apply-data-quality-gate",
      step: 3,
      title: "Apply data quality gate",
      titleZh: "应用数据质量门",
      status: needsReview || rejected ? "warning" : "completed",
      inputCount: totalFrameworks,
      outputCount: ready,
      decision: `${ready} ready, ${needsReview} needs review, ${rejected} rejected by hard gate.`,
      decisionZh: `${ready} 个可评分，${needsReview} 个需复核，${rejected} 个被硬阈值拒绝。`,
      linkedSectionId: "organic-acid-final-provenance",
    },
    {
      id: "attach-qmof-descriptors",
      step: 4,
      title: "Attach QMOF descriptors",
      titleZh: "挂接 QMOF 描述符",
      status: report.unmatchedQmofDescriptorRecords ? "warning" : "completed",
      inputCount: qmofRecords,
      outputCount: qmofRecords - (report.unmatchedQmofDescriptorRecords || 0),
      decision: `${report.unmatchedQmofDescriptorRecords || 0} descriptor records remain unmatched.`,
      decisionZh: `${report.unmatchedQmofDescriptorRecords || 0} 条描述符记录未匹配。`,
      linkedSectionId: "organic-acid-final-provenance",
    },
    {
      id: "attach-literature-evidence",
      step: 5,
      title: "Attach literature evidence",
      titleZh: "挂接文献证据",
      status: "completed",
      inputCount: evidenceRecords,
      outputCount: evidenceRecords,
      decision: "Evidence records remain pending verification unless DOI metadata is present.",
      decisionZh: "证据记录在无 DOI 元数据时保持待核状态。",
      linkedSectionId: "organic-acid-final-provenance",
    },
    {
      id: "apply-hydrothermal-gate-curated",
      step: 6,
      title: "Apply hydrothermal gate",
      titleZh: "应用水热门槛",
      status: rejected ? "warning" : "completed",
      inputCount: totalFrameworks,
      outputCount: ready,
      decision: "Needs-review records stay visible but cannot enter final recommendation.",
      decisionZh: "需复核记录保持可见，但不能进入最终推荐。",
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "calculate-oacs-curated",
      step: 7,
      title: "Calculate OACS for eligible examples",
      titleZh: "为合格样例计算 OACS",
      status: "completed",
      inputCount: ready,
      outputCount: ready,
      decision: "OACS is calculated only for records that pass the V1.6 data quality gate.",
      decisionZh: "仅对通过 V1.6 数据质量门的记录计算 OACS。",
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "project-curated-hot-spot",
      step: 8,
      title: "Project points to hot spot map",
      titleZh: "投影到热区图",
      status: "completed",
      inputCount: totalFrameworks,
      outputCount: totalFrameworks,
      decision: report.hotSpotProjectionStatus || "Curated points projected with source and quality roles.",
      decisionZh: "人工整理样例已带来源和质量状态投影到热区图。",
      linkedSectionId: "organic-acid-final-hot-spot-map",
    },
    {
      id: "generate-curated-review-summary",
      step: 9,
      title: "Generate review summary",
      titleZh: "生成复核摘要",
      status: "completed",
      inputCount: totalFrameworks,
      outputCount: 1,
      decision: "Run summary reports DOI coverage, field provenance, and no-full-database boundary.",
      decisionZh: "运行摘要展示 DOI 覆盖率、字段来源和非全量数据库边界。",
      linkedSectionId: "organic-acid-final-run-launcher",
    },
  ]
}

export function buildRunSteps(screeningResult = {}, options = {}) {
  const dataMode = options.dataMode || "demo_workflow"
  if (dataMode === "database_index_preview") {
    return buildDatabaseIndexRunSteps(screeningResult)
  }
  if (dataMode === "curated_real_examples") {
    return buildCuratedRunSteps(screeningResult)
  }
  const selected = screeningResult?.selectedFramework || {}
  const mo = screeningResult?.moRecommendation || {}
  const w = (screeningResult?.rankedMetals || []).find(row => row.metal === "W") || {}
  const hotSpotMo = (screeningResult?.synergyHotSpotData || []).find(row => row.metal === "Mo") || {}
  const scaffoldCount = (screeningResult?.rankedFrameworks || []).length
  const passCount = (screeningResult?.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status === "pass").length
  const metalCount = (screeningResult?.rankedMetals || []).length
  const status = "completed"

  return [
    {
      id: "load-candidate-frameworks",
      step: 1,
      title: "Load candidate frameworks",
      titleZh: "加载候选骨架",
      status,
      inputCount: scaffoldCount,
      outputCount: scaffoldCount,
      decision: dataMode === "mapped_fixtures" ? "Mapped fixtures use the V1.5 schema preview layer." : "Demo framework pool loaded.",
      decisionZh: dataMode === "mapped_fixtures" ? "映射样例使用 V1.5 schema preview 层。" : "演示骨架池已加载。",
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "apply-hydrothermal-gate",
      step: 2,
      title: "Apply hydrothermal hard gate",
      titleZh: "应用水热硬阈值",
      status,
      inputCount: scaffoldCount,
      outputCount: passCount,
      decision: `${passCount} candidates pass the >=150 C water-stability gate.`,
      decisionZh: `${passCount} 个候选通过 >=150 C 水稳定性阈值。`,
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "calculate-oacs",
      step: 3,
      title: "Calculate OACS",
      titleZh: "计算 OACS",
      status,
      inputCount: passCount,
      outputCount: passCount,
      decision: `Selected scaffold OACS ${selected?.organicAcidScore?.oacs ?? "Pending"}.`,
      decisionZh: `选定骨架 OACS ${selected?.organicAcidScore?.oacs ?? "Pending"}。`,
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "select-scaffold",
      step: 4,
      title: "Select scaffold",
      titleZh: "选择骨架候选",
      status,
      inputCount: passCount,
      outputCount: selected?.id ? 1 : 0,
      decision: selected?.displayName || "Selected scaffold pending.",
      decisionZh: selected?.displayName || "选定骨架待定。",
      linkedSectionId: "organic-acid-final-framework-ranking",
    },
    {
      id: "evaluate-dopant-metals",
      step: 5,
      title: "Evaluate dopant metals",
      titleZh: "评估第二金属",
      status,
      inputCount: metalCount,
      outputCount: metalCount,
      decision: "Mo, W, V, Fe, Ti, Zr remain visible with Ru/Pd/Ag blind baselines.",
      decisionZh: "Mo、W、V、Fe、Ti、Zr 保持可见，并保留 Ru/Pd/Ag 盲测基线。",
      linkedSectionId: "organic-acid-final-dopant-matrix",
    },
    {
      id: "calculate-dmrs",
      step: 6,
      title: "Calculate DMRS",
      titleZh: "计算 DMRS",
      status,
      inputCount: metalCount,
      outputCount: metalCount,
      decision: `Mo ${mo.dmrs ?? "Pending"}; W ${w.dmrs ?? "Pending"}.`,
      decisionZh: `Mo ${mo.dmrs ?? "Pending"}；W ${w.dmrs ?? "Pending"}。`,
      linkedSectionId: "organic-acid-final-dopant-matrix",
    },
    {
      id: "run-sensitivity-audit",
      step: 7,
      title: "Run sensitivity audit",
      titleZh: "运行稳健性审计",
      status: status === "completed" && screeningResult?.moRobustnessAudit?.status === "audit_required" ? "warning" : status,
      inputCount: metalCount,
      outputCount: screeningResult?.fullMetalSensitivityDistribution?.length || metalCount,
      decision: screeningResult?.moRobustnessAudit?.label || "Sensitivity audit pending.",
      decisionZh: screeningResult?.moRobustnessAudit?.label || "敏感性审计待定。",
      linkedSectionId: "organic-acid-final-robustness-audit",
    },
    {
      id: "build-hot-spot-map",
      step: 8,
      title: "Build hot spot map",
      titleZh: "构建热区图",
      status,
      inputCount: screeningResult?.synergyHotSpotData?.length || 0,
      outputCount: screeningResult?.synergyHotSpotData?.length || 0,
      decision: hotSpotMo?.hotSpotStatus || "Hot spot projection pending.",
      decisionZh: hotSpotMo?.hotSpotStatus || "热区投影待定。",
      linkedSectionId: "organic-acid-final-hot-spot-map",
    },
    {
      id: "generate-exafs-hypothesis",
      step: 9,
      title: "Generate EXAFS hypothesis",
      titleZh: "生成 EXAFS 假设",
      status,
      inputCount: mo?.metal ? 1 : 0,
      outputCount: screeningResult?.exafsSignature?.expectedFeatures?.length || 0,
      decision: "Mo K-edge EXAFS can falsify the isolated Mo-oxo anchoring hypothesis.",
      decisionZh: "Mo K-edge EXAFS 可证伪孤立 Mo-oxo 锚定假设。",
      linkedSectionId: "organic-acid-final-exafs",
    },
    {
      id: "build-candidate-report-trace",
      step: 10,
      title: "Build candidate report trace",
      titleZh: "构建候选报告追踪",
      status,
      inputCount: (screeningResult?.algorithmTrace || []).length,
      outputCount: (screeningResult?.algorithmTrace || []).length,
      decision: "Trace keeps demo/proxy evidence boundaries visible.",
      decisionZh: "追踪记录保留 demo/proxy 证据边界。",
      linkedSectionId: "organic-acid-final-validation-roadmap",
    },
  ]
}

export function buildRunResultSummary(screeningResult = {}, dataMode = "demo_workflow") {
  if (dataMode === "database_index_preview") {
    return buildDatabaseIndexRunResultSummary(screeningResult)
  }
  if (dataMode === "curated_real_examples") {
    const report = screeningResult.mappingReport || screeningResult.summary || {}
    return {
      dataMode,
      runType: "Small curated sample validation",
      selectedScaffold: screeningResult.selectedFramework?.displayName || "No curated final recommendation",
      oacs: screeningResult.selectedFramework?.organicAcidScore?.oacs ?? null,
      frameworkRecords: report.frameworkRecords || 0,
      readyForScoring: report.readyForScoring || 0,
      needsReview: report.needsReview || 0,
      rejected: report.rejected || 0,
      qmofDescriptorRecords: report.qmofDescriptorRecords || 0,
      evidenceRecords: report.evidenceRecords || 0,
      unmatchedQmofDescriptorRecords: report.unmatchedQmofDescriptorRecords || 0,
      doiCoverage: report.doiCoverage ?? 0,
      fieldProvenanceCoverage: report.fieldProvenanceCoverage ?? 0,
      hotSpotProjectionStatus: report.hotSpotProjectionStatus || "projected_with_quality_gate_roles",
      evidenceBoundary: report.boundary || "Small curated sample only. Not full database screening.",
      evidenceBoundaryZh: report.boundaryZh || "仅小规模人工整理样例；不是全量数据库筛选。",
    }
  }
  const selected = screeningResult?.selectedFramework || {}
  const mo = screeningResult?.moRecommendation || {}
  const w = (screeningResult?.rankedMetals || []).find(row => row.metal === "W") || {}
  const gap = mo.dmrs != null && w.dmrs != null ? roundMetric((mo.dmrs || 0) - (w.dmrs || 0)) : null
  const hotSpotMo = (screeningResult?.synergyHotSpotData || []).find(row => row.metal === "Mo") || {}
  return {
    dataMode,
    selectedScaffold: selected.displayName || "Pending scaffold",
    oacs: selected?.organicAcidScore?.oacs ?? null,
    topDopants: ["Mo", "W"],
    moDmrs: mo.dmrs ?? null,
    wDmrs: w.dmrs ?? null,
    moWGap: gap,
    robustnessStatus: screeningResult?.moRobustnessAudit?.label || "audit required",
    evidenceBoundary: "This is a demo/proxy run. It does not represent full database screening or verified catalytic performance.",
    evidenceBoundaryZh: "这是演示级代理运行结果，不代表全量数据库筛选或已验证催化性能。",
    hotSpotStatus: hotSpotMo?.hotSpotStatus || "demo/proxy hot spot pending",
    exafsHypothesisStatus: screeningResult?.exafsSignature?.technique ? "falsifiable hypothesis generated" : "pending",
  }
}

export function buildRunTraceFromResult(screeningResult = {}, runSteps = []) {
  const trace = Array.isArray(screeningResult?.algorithmTrace) ? screeningResult.algorithmTrace : []
  const isCurated = screeningResult?.datasetMode === "curated_real_examples" || screeningResult?.dataMode === "curated_real_examples"
  return [
    {
      id: "run-boundary",
      title: "Run boundary",
      titleZh: "运行边界",
      detail: isCurated
        ? "Curated mode uses a small V1.6 sample to validate mapping, quality gates, and hot spot projection. It is not full database screening."
        : "Run demo screening workflow uses current demo / mapped-fixture-ready data only.",
      detailZh: isCurated
        ? "Curated 模式使用 V1.6 小样例验证映射、质量门和热区投影；不是全量数据库筛选。"
        : "运行演示筛选流程只使用当前 demo / mapped-fixture-ready 数据。",
    },
    ...runSteps.map(step => ({
      id: `run-${step.id}`,
      title: step.title,
      titleZh: step.titleZh,
      detail: `${step.status}: ${step.decision}`,
      detailZh: `${step.status}: ${step.decisionZh}`,
      linkedSectionId: step.linkedSectionId,
    })),
    ...trace,
  ]
}

export function runDemoScreeningWorkflow(frameworkCandidates, metalMatrix, rules = {}, evidenceRecords = [], options = {}) {
  const dataMode = options.dataMode || "demo_workflow"
  if (dataMode === "database_index_preview") {
    const result = options.databaseIndexOverview || {}
    const steps = buildRunSteps(result, { dataMode })
    const trace = buildDatabaseIndexTrace(result, {
      selectedModules: options.selectedModules || [],
    })
    return {
      status: trace.status === "blocked" ? "blocked" : "completed",
      dataMode,
      steps,
      result,
      runResult: result,
      summary: buildRunResultSummary(result, dataMode),
      trace,
      legacyTrace: [],
    }
  }
  if (dataMode === "curated_real_examples") {
    const result = options.curatedRealResult || buildCuratedRealScreeningResult(options.curatedRealExamples || null, metalMatrix, rules)
    const steps = buildRunSteps(result, { dataMode })
    const legacyTrace = buildRunTraceFromResult(result, steps)
    const trace = buildRunTrace({
      screeningResult: result,
      runSteps: steps,
      dataMode,
      selectedModules: options.selectedModules || [],
      legacyTrace,
    })
    return {
      status: trace.status === "blocked" ? "blocked" : "completed",
      dataMode,
      steps,
      result,
      runResult: result,
      summary: buildRunResultSummary(result, dataMode),
      trace,
      legacyTrace,
    }
  }
  const result = runOrganicAcidFinalScreening(frameworkCandidates, metalMatrix, rules, evidenceRecords)
  const steps = buildRunSteps(result, { dataMode })
  const legacyTrace = buildRunTraceFromResult(result, steps)
  const trace = buildRunTrace({
    screeningResult: result,
    runSteps: steps,
    dataMode,
    selectedModules: options.selectedModules || [],
    legacyTrace,
  })
  return {
    status: trace.status === "blocked" ? "blocked" : "completed",
    dataMode,
    steps,
    result,
    runResult: result,
    summary: buildRunResultSummary(result, dataMode),
    trace,
    legacyTrace,
  }
}

export function runOrganicAcidFinalScreening(frameworkCandidates, metalMatrix, rules = {}, evidenceRecords = []) {
  const loadedEvidenceRecords = loadEvidenceRecords(evidenceRecords)
  const frameworkRows = loadedEvidenceRecords.length
    ? attachEvidenceToFrameworks(frameworkCandidates || [], loadedEvidenceRecords)
    : (frameworkCandidates || [])
  const metalRows = loadedEvidenceRecords.length
    ? attachEvidenceToMetals(metalMatrix || [], loadedEvidenceRecords)
    : (metalMatrix || [])
  const frameworkWeights = rules.frameworkWeights || DEFAULT_FRAMEWORK_WEIGHTS
  const dopantWeights = rules.dopantWeights || DEFAULT_DOPANT_WEIGHTS
  const gatedFrameworks = (frameworkRows || []).map(candidate => calculateOACS(
    applyHydrothermalGate(candidate, rules),
    frameworkWeights,
  ))
  const gateOrder = { pass: 0, needs_review: 1, fail: 2 }
  const rankedFrameworks = [...gatedFrameworks].sort((a, b) => {
    const gateDiff = (gateOrder[a.hydrothermalGate?.status] ?? 3) - (gateOrder[b.hydrothermalGate?.status] ?? 3)
    if (gateDiff !== 0) return gateDiff
    return (b.organicAcidScore?.oacs || 0) - (a.organicAcidScore?.oacs || 0)
  }).map((candidate, index) => ({ ...candidate, rank: index + 1 }))
  const organicAcidAlgorithm = rankOrganicAcidCandidates({
    candidates: rankedFrameworks,
    taskDefinition: ORGANIC_ACID_TASK_DEFINITION,
    scoringMode: rules?.organicAcidAlgorithm?.scoringMode || "formic_acid_priority",
    featureSchema: ORGANIC_ACID_FEATURE_SCHEMA,
    topN: 10,
  })

  const selectedFramework = rankedFrameworks.find(candidate => candidate.hydrothermalGate?.status === "pass") || rankedFrameworks[0] || null
  const sensitivity = runSensitivityAnalysis(
    metalRows || [],
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
  const rankedMetals = (metalRows || [])
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
    metalRows || [],
    rules.provenanceDescriptorKeys || METAL_DESCRIPTOR_KEYS,
  )
  const hardGateSummary = rankedFrameworks.reduce((acc, row) => {
    const status = row.hydrothermalGate?.status || "pending"
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const baseResult = {
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
    evidenceRecords: loadedEvidenceRecords,
    evidenceCoverage: calculateEvidenceCoverage(loadedEvidenceRecords),
    blindBaselineSummary: generateBlindBaselineSummary(rankedMetals),
    exafsSignature: generateExpectedEXAFSSignature("Mo", moRecommendation?.mostLikelyForm),
    reproducibilityStatement: generateReproducibilityStatement(),
    hardGateSummary,
    organicAcidAlgorithm,
  }
  const scaffoldHotSpotData = buildScaffoldHotSpotData(rankedFrameworks, selectedFramework?.id || null)
  const dopantHotSpotData = buildDopantHotSpotData(rankedMetals)
  const synergyHotSpotData = buildSynergyHotSpotData(selectedFramework, rankedMetals)
  const hotSpotRegion = calculateHotSpotRegion(synergyHotSpotData)

  return {
    ...baseResult,
    algorithmJourneySteps: buildAlgorithmJourneySteps(baseResult),
    screeningFunnelData: buildScreeningFunnelData(rankedFrameworks, rankedMetals, selectedFramework),
    stageSummary: buildStageSummary(baseResult, rankedFrameworks),
    mechanismRadarData: buildMechanismRadarData(rankedMetals),
    sensitivityRankBars: buildSensitivityRankBars(sensitivity.summaries || []),
    algorithmTrace: buildAlgorithmTrace(baseResult),
    evidenceStrengthMatrix: buildEvidenceStrengthMatrix(loadedEvidenceRecords, baseResult),
    methodologyFlowData: buildMethodologyFlowData(rules, baseResult),
    formulaCards: buildFormulaCards(rules),
    validationLoopData: buildValidationLoopData(rules),
    scaffoldHotSpotData,
    dopantHotSpotData,
    synergyHotSpotData: synergyHotSpotData.map(point => ({
      ...point,
      hotSpotStatus: classifyHotSpotStatus(point, hotSpotRegion),
    })),
    hotSpotRegion,
    descriptorCouplingData: buildDescriptorCouplingData(),
    validationEvidenceLadder: buildValidationEvidenceLadder(),
  }
}
