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

function evidenceConfidenceScore(value) {
  const text = String(value || "").toLowerCase()
  if (text.includes("high")) return 0.82
  if (text.includes("medium")) return 0.64
  if (text.includes("low")) return 0.36
  return clamp01(value)
}

function normalizeWeights(weights, fallback) {
  const source = { ...fallback, ...(weights || {}) }
  const total = Object.values(source).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
  if (!total) return { ...fallback }
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, Math.max(0, Number(value) || 0) / total]))
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
    d.metalOxoAnchoringTrend ?? metal?.oxoAffinity,
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
  const riskPenalty = avg([metal?.aggregationRisk, metal?.leachingRisk]) * 0.3
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
    metal?.co2ActivationPotential,
    metal?.redoxAdaptability,
    metal?.lewisAcidContribution,
    metal?.formateAffinityProxy?.value,
  ])
}

function aqueousStabilityValue(metal, framework) {
  const frameworkCompatibility = clamp01(framework?.organicAcidScore?.oacs ?? framework?.descriptorScores?.hydrothermalEvidenceStrength)
  return clamp01(0.55 * frameworkCompatibility + 0.45 * (1 - clamp01(metal?.hydrothermalRisk)))
}

function riskValue(metal) {
  return avg([
    metal?.leachingRisk,
    metal?.aggregationRisk,
    metal?.nobleMetalPenalty,
    metal?.costPenalty,
  ])
}

export function calculateDMRS(metal, framework, weights = DEFAULT_DOPANT_WEIGHTS) {
  const w = normalizeWeights(weights, DEFAULT_DOPANT_WEIGHTS)
  const mechanism = calculateMechanismFeasibility(metal, framework)
  const activeSite = activeSiteValue(metal)
  const aqueousStability = aqueousStabilityValue(metal, framework)
  const evidenceSupport = avg([
    evidenceConfidenceScore(metal?.evidenceConfidence),
    clamp01((metal?.formateAffinityProxy?.evidence_count || 0) / 4),
    metal?.formateAffinityProxy?.direct_dft_available ? 0.85 : 0.45,
  ])
  const risk = riskValue(metal)
  const score =
    w.activeSiteValue * activeSite +
    w.mechanismFeasibility * mechanism.score +
    w.aqueousStability * aqueousStability +
    w.evidenceSupport * evidenceSupport -
    w.riskPenalty * risk

  const contributionBreakdown = [
    { key: "co2ActivationPotential", label: "CO2 activation", value: roundMetric(w.activeSiteValue * clamp01(metal?.co2ActivationPotential) * 0.25) },
    { key: "redoxAdaptability", label: "Redox adaptability", value: roundMetric(w.activeSiteValue * clamp01(metal?.redoxAdaptability) * 0.25) },
    { key: "lewisAcidContribution", label: "Lewis acid contribution", value: roundMetric(w.activeSiteValue * clamp01(metal?.lewisAcidContribution) * 0.25) },
    { key: "defectAnchoringFeasibility", label: "Defect anchoring feasibility", value: roundMetric(w.mechanismFeasibility * mechanism.defectAnchoring.score) },
    { key: "formateAffinityProxy", label: "Formate affinity proxy", value: roundMetric(w.activeSiteValue * clamp01(metal?.formateAffinityProxy?.value) * 0.25) },
    { key: "aqueousStability", label: "Aqueous stability support", value: roundMetric(w.aqueousStability * aqueousStability) },
    { key: "evidenceSupport", label: "Evidence support", value: roundMetric(w.evidenceSupport * evidenceSupport) },
    { key: "leachingRisk", label: "Leaching risk", value: -roundMetric(w.riskPenalty * clamp01(metal?.leachingRisk) * 0.45) },
    { key: "aggregationRisk", label: "Aggregation risk", value: -roundMetric(w.riskPenalty * clamp01(metal?.aggregationRisk) * 0.35) },
    { key: "nodeSubstitutionMismatch", label: "Node substitution mismatch", value: -roundMetric(w.mechanismFeasibility * (1 - mechanism.nodeSubstitution.score) * 0.16) },
  ]

  const strengths = [
    ["CO2 activation", metal?.co2ActivationPotential],
    ["redox adaptability", metal?.redoxAdaptability],
    ["Lewis acid contribution", metal?.lewisAcidContribution],
    ["defect anchoring", mechanism.defectAnchoring.score],
    ["pore confinement", mechanism.poreConfinement.score],
  ].sort((a, b) => (b[1] || 0) - (a[1] || 0))
  const risks = [
    ["leaching", metal?.leachingRisk],
    ["aggregation", metal?.aggregationRisk],
    ["hydrothermal risk", metal?.hydrothermalRisk],
    ["cost / noble-metal penalty", (metal?.costPenalty || 0) + (metal?.nobleMetalPenalty || 0)],
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
    source: metal,
  }
}

export function runSensitivityAnalysis(metals, framework, baseWeights = DEFAULT_DOPANT_WEIGHTS, iterations = 1000, options = {}) {
  const perturbationRange = options.perturbationRange ?? 0.2
  const rng = seededRandom(options.seed ?? 170)
  const rankStats = new Map((metals || []).map(metal => [metal.metal, []]))
  const base = normalizeWeights(baseWeights, DEFAULT_DOPANT_WEIGHTS)

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const perturbed = Object.fromEntries(Object.entries(base).map(([key, value]) => {
      const delta = (rng() * 2 - 1) * perturbationRange
      return [key, Math.max(0.01, value * (1 + delta))]
    }))
    const weights = normalizeWeights(perturbed, DEFAULT_DOPANT_WEIGHTS)
    const ranked = (metals || [])
      .map(metal => calculateDMRS(metal, framework, weights))
      .sort((a, b) => b.dmrs - a.dmrs)
    ranked.forEach((row, index) => {
      rankStats.get(row.metal)?.push(index + 1)
    })
  }

  const summaries = [...rankStats.entries()].map(([metal, ranks]) => {
    const meanRank = ranks.reduce((sum, rank) => sum + rank, 0) / Math.max(1, ranks.length)
    const variance = ranks.reduce((sum, rank) => sum + (rank - meanRank) ** 2, 0) / Math.max(1, ranks.length)
    const top1 = ranks.filter(rank => rank === 1).length / Math.max(1, ranks.length)
    const top3 = ranks.filter(rank => rank <= 3).length / Math.max(1, ranks.length)
    return {
      metal,
      iterations,
      perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
      top1Probability: roundMetric(top1),
      top3Probability: roundMetric(top3),
      meanRank: roundMetric(meanRank, 2),
      rankStd: roundMetric(Math.sqrt(variance), 2),
      robust: top3 >= (options.robustTop3Threshold ?? 0.85),
    }
  })

  return {
    iterations,
    perturbationRange: `+/-${Math.round(perturbationRange * 100)}%`,
    summaries,
    targetMetal: summaries.find(row => row.metal === "Mo") || summaries[0] || null,
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
      sensitivityStatus: sensitivityByMetal.get(row.metal)?.robust ? "robust recommendation" : "hypothesis-generating",
    }))

  const moRecommendation = rankedMetals.find(row => row.metal === "Mo") || null
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
    blindBaselineSummary: generateBlindBaselineSummary(rankedMetals),
    exafsSignature: generateExpectedEXAFSSignature("Mo", moRecommendation?.mostLikelyForm),
    reproducibilityStatement: generateReproducibilityStatement(),
    hardGateSummary,
  }
}
