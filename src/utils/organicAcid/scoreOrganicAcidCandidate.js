// @ts-nocheck

import { calculateOrganicAcidRiskPenalty } from "./calculateOrganicAcidRiskPenalty"
import {
  ORGANIC_ACID_FEATURE_SCHEMA,
  buildOrganicAcidFeatureSet,
  flattenOrganicAcidFeatureSources,
  getFeatureNumericValue,
  getFeatureScore,
} from "./organicAcidFeatureSchema"
import { ORGANIC_ACID_TASK_DEFINITION } from "./organicAcidTaskDefinition"
import {
  ORGANIC_ACID_SCORE_EQUATION,
  normalizeOrganicAcidWeights,
  resolveOrganicAcidScoringMode,
} from "./organicAcidScoringWeights"

function clamp01(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(1, Math.max(0, numeric))
}

function round3(value) {
  return Number(clamp01(value).toFixed(3))
}

function avg(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function candidateName(candidate = {}) {
  return candidate.candidateName || candidate.displayName || candidate.rawName || candidate.id || candidate.candidateId || "Organic Acid candidate"
}

function boolScore(features, field) {
  return features[field]?.value ? 1 : 0
}

function dimensionScores(features = {}) {
  const pathwayFitScore = avg([
    getFeatureScore(features, "formicAcidPathwayFit"),
    1 - getFeatureScore(features, "competingPathwayRisk"),
    getFeatureScore(features, "CO2ActivationRelevance"),
    getFeatureScore(features, "HTransferRelevance"),
    getFeatureScore(features, "hydrideTransferRelevance"),
  ])
  const evidenceScore = avg([
    getFeatureScore(features, "evidenceLevel"),
    getFeatureScore(features, "literatureSupport"),
    getFeatureScore(features, "experimentalComparability"),
    getFeatureScore(features, "mechanismSupport"),
    boolScore(features, "sourceConfirmed"),
    boolScore(features, "citationReady"),
    boolScore(features, "verifiedMetadata"),
  ])
  const graphRelevanceScore = avg([
    getFeatureScore(features, "pathwayCentrality"),
    getFeatureScore(features, "nodeBetweenness"),
    getFeatureScore(features, "edgeConfidence"),
    getFeatureScore(features, "reactionStepCoverage"),
    getFeatureScore(features, "graphConnectivity"),
  ])
  const poreSizeFit = (() => {
    const pore = getFeatureNumericValue(features, "poreSizeA", 5.2)
    return clamp01(1 - Math.abs(pore - 5.2) / 8)
  })()
  const structureSuitabilityScore = avg([
    poreSizeFit,
    clamp01(getFeatureNumericValue(features, "poreVolume") / 0.6),
    clamp01(getFeatureNumericValue(features, "surfaceArea") / 1200),
    getFeatureScore(features, "stabilityProxy"),
    1 - getFeatureScore(features, "collapseRisk"),
  ])
  const validationReadinessScore = avg([
    getFeatureScore(features, "labTestability"),
    getFeatureScore(features, "conditionCompatibility"),
    getFeatureScore(features, "materialAvailability"),
    1 - getFeatureScore(features, "characterizationNeed"),
    getFeatureScore(features, "nextExperimentFeasibility"),
  ])
  const dataQualityScore = avg([
    getFeatureScore(features, "descriptorCompleteness"),
    getFeatureScore(features, "fieldProvenanceCoverage"),
    clamp01(1 - getFeatureNumericValue(features, "ambiguityWarnings") * 0.3),
    clamp01(1 - getFeatureNumericValue(features, "missingCriticalFields") * 0.25),
    features.syntheticFixtureFlag?.value ? 0 : 1,
  ])

  return {
    pathwayFitScore: round3(pathwayFitScore),
    evidenceScore: round3(evidenceScore),
    graphRelevanceScore: round3(graphRelevanceScore),
    structureSuitabilityScore: round3(structureSuitabilityScore),
    validationReadinessScore: round3(validationReadinessScore),
    dataQualityScore: round3(dataQualityScore),
  }
}

function buildMissingInputs(features = {}, taskDefinition = ORGANIC_ACID_TASK_DEFINITION) {
  return (taskDefinition.requiredInputs || [])
    .filter(field => features[field]?.status === "missing" || features[field]?.value === null || features[field]?.value === undefined)
    .map(field => ({
      field,
      missingReason: features[field]?.missingReason || `${field} missing`,
      weightGroup: features[field]?.weightGroup || ORGANIC_ACID_FEATURE_SCHEMA[field]?.weightGroup || "unknown",
    }))
}

function buildMainReasons(scores, features, mode) {
  const ranked = [
    ["pathwayFitScore", scores.pathwayFitScore, "甲酸路径适配贡献最高", "formic-acid pathway fit"],
    ["evidenceScore", scores.evidenceScore, "证据与来源状态支撑排序", "evidence and source state"],
    ["graphRelevanceScore", scores.graphRelevanceScore, "图论相关性代理支持路径解释", "graph relevance proxy"],
    ["structureSuitabilityScore", scores.structureSuitabilityScore, "结构稳定性与孔道适配较好", "structure suitability"],
    ["validationReadinessScore", scores.validationReadinessScore, "下一步实验可执行性较好", "validation readiness"],
    ["dataQualityScore", scores.dataQualityScore, "数据完整度支持审计", "data quality"],
  ].sort((a, b) => b[1] - a[1])
  return [
    `${mode.labelZh}：${mode.rankingImpactZh}`,
    ...ranked.slice(0, 3).map(row => `${row[2]} (${row[0]}=${row[1].toFixed(3)})`),
    `目标产物：${features.formicAcidPathwayFit?.weightGroup === "pathwayFitScore" ? "甲酸 / formic acid" : "organic acid"}`,
  ]
}

function buildNextExperiment(features = {}, risk = {}) {
  if (getFeatureScore(features, "collapseRisk") >= 0.7) {
    return "先做 170C 水相稳定性、反应后 PXRD/BET 与 ICP-OES；坍塌风险未排除前不进入优先验证。"
  }
  if (features.syntheticFixtureFlag?.value) {
    return "先用真实来源记录替换 demo fixture，再做 CO2 水相甲酸路径小试验证。"
  }
  if (risk.blockingRisks?.length) {
    return `先关闭阻断风险：${risk.blockingRisks.map(row => row.labelZh).join("、")}。`
  }
  return "进行 CO2 水相甲酸路径小试；检测 formate/formic acid 产物分布，并做反应后 PXRD、ICP-OES 与关键中间体证据复核。"
}

function recommendationClass(finalScore, risk, features, missingInputs, nextExperiment) {
  if (getFeatureScore(features, "collapseRisk") >= 0.8) return "rejected"
  if (risk.blockingRisks?.some(row => row.key === "syntheticFixtureFlag")) return "data_needed"
  if (missingInputs.length >= 2) return "data_needed"
  if (risk.blockingRisks?.length) return "mechanism_check_needed"
  if (!nextExperiment) return "data_needed"
  if (finalScore >= 0.62) return "priority_validation"
  if (finalScore >= 0.46) return "mechanism_check_needed"
  return "low_priority"
}

function buildDecisionTrace({ candidate, features, scores, weightedContributions, risk, finalScore, rank, nextExperiment }) {
  const blocker = risk.blockingRisks?.map(row => row.label).join(", ") || ""
  const loadedName = candidateName(candidate)
  return [
    {
      step: "Candidate Loaded",
      input: loadedName,
      output: candidate?.sourceRecordId || candidate?.id || "candidate id pending",
      affectedScore: 0,
      blocker: "",
      explanation: "Candidate record loaded with field-level provenance placeholders where source fields are incomplete.",
      explanationZh: "候选记录已加载；来源字段不完整时保留字段级溯源占位。",
    },
    {
      step: "Feature Availability Check",
      input: "requiredInputs",
      output: `descriptorCompleteness=${scores.dataQualityScore.toFixed(3)}`,
      affectedScore: weightedContributions.dataQualityScore,
      blocker: getFeatureNumericValue(features, "missingCriticalFields") ? "missingCriticalFields" : "",
      explanation: "Required V2.6 fields are checked before scoring.",
      explanationZh: "评分前检查 V2.6 必需字段。",
    },
    {
      step: "Pathway Fit Calculation",
      input: "formicAcidPathwayFit, CO2ActivationRelevance, HTransferRelevance",
      output: scores.pathwayFitScore.toFixed(3),
      affectedScore: weightedContributions.pathwayFitScore,
      blocker: getFeatureScore(features, "formicAcidPathwayFit") < 0.35 ? "low formic-acid pathway fit" : "",
      explanation: "Pathway fit estimates whether the candidate supports CO2-to-formic-acid priority chemistry.",
      explanationZh: "路径适配估计候选是否支持 CO2 到甲酸优先路径。",
    },
    {
      step: "Evidence Adjustment",
      input: "evidenceLevel, literatureSupport, sourceConfirmed, citationReady",
      output: scores.evidenceScore.toFixed(3),
      affectedScore: weightedContributions.evidenceScore,
      blocker: getFeatureScore(features, "evidenceLevel") < 0.35 ? "low evidence" : "",
      explanation: "Evidence fields adjust the score without claiming experimental validation.",
      explanationZh: "证据字段修正评分，但不声明实验验证。",
    },
    {
      step: "Graph Relevance Calculation",
      input: "pathwayCentrality, nodeBetweenness, edgeConfidence, reactionStepCoverage",
      output: scores.graphRelevanceScore.toFixed(3),
      affectedScore: weightedContributions.graphRelevanceScore,
      blocker: "",
      explanation: "Graph relevance is a white-box proxy derived from pathway and descriptor coverage.",
      explanationZh: "图论相关性是由路径与描述符覆盖派生的白盒代理。",
    },
    {
      step: "Structure Suitability Calculation",
      input: "poreSizeA, poreVolume, surfaceArea, stabilityProxy, collapseRisk",
      output: scores.structureSuitabilityScore.toFixed(3),
      affectedScore: weightedContributions.structureSuitabilityScore,
      blocker: getFeatureScore(features, "collapseRisk") >= 0.7 ? "collapseRisk high" : "",
      explanation: "Structure suitability rewards accessible pores and stability while subtracting collapse risk.",
      explanationZh: "结构适配奖励可达孔道与稳定性，并压低坍塌风险。",
    },
    {
      step: "Risk Penalty Applied",
      input: risk.penaltyBreakdown.map(row => row.label).join(", ") || "no configured risk triggered",
      output: risk.totalPenalty.toFixed(3),
      affectedScore: -risk.totalPenalty,
      blocker,
      explanation: risk.explanation,
      explanationZh: risk.explanationZh,
    },
    {
      step: "Validation Readiness Check",
      input: "labTestability, conditionCompatibility, materialAvailability, nextExperimentFeasibility",
      output: scores.validationReadinessScore.toFixed(3),
      affectedScore: weightedContributions.validationReadinessScore,
      blocker: getFeatureScore(features, "conditionCompatibility") < 0.45 ? "conditionCompatibility low" : "",
      explanation: "Validation readiness checks whether the next experiment is feasible before prioritization.",
      explanationZh: "验证就绪度检查下一步实验是否可执行。",
    },
    {
      step: "Final Ranking",
      input: ORGANIC_ACID_SCORE_EQUATION,
      output: `rank=${rank || "pending"} score=${finalScore.toFixed(3)}`,
      affectedScore: finalScore,
      blocker,
      explanation: "Final ranking is a screening priority, not a final recommendation.",
      explanationZh: "最终排序表示筛选优先级，不是最终推荐。",
    },
    {
      step: "Next Experiment Generated",
      input: "scoreBreakdown + riskPenalty + validationReadiness",
      output: nextExperiment,
      affectedScore: 0,
      blocker: nextExperiment ? "" : "no nextExperiment",
      explanation: "The generated experiment is an algorithmic suggestion and requires experimental validation.",
      explanationZh: "生成的实验是算法建议，仍需实验验证。",
    },
  ]
}

export function scoreOrganicAcidCandidate(candidate = {}, {
  taskDefinition = ORGANIC_ACID_TASK_DEFINITION,
  scoringMode = "balanced",
  featureSchema = ORGANIC_ACID_FEATURE_SCHEMA,
  rank,
} = {}) {
  const mode = resolveOrganicAcidScoringMode(scoringMode)
  const weights = normalizeOrganicAcidWeights(mode.weights)
  const features = candidate.features || buildOrganicAcidFeatureSet(candidate, featureSchema)
  const scores = dimensionScores(features)
  const risk = calculateOrganicAcidRiskPenalty(features)
  const weightedContributions = Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, round3(scores[key] * value)]))
  const weightedScore = Object.values(weightedContributions).reduce((sum, value) => sum + value, 0)
  const finalScore = round3(weightedScore - risk.totalPenalty)
  const missingInputs = buildMissingInputs(features, taskDefinition)
  const nextExperiment = buildNextExperiment(features, risk)
  const recommendation = recommendationClass(finalScore, risk, features, missingInputs, nextExperiment)
  const mainReasons = buildMainReasons(scores, features, mode)
  const mainRisks = risk.penaltyBreakdown.length
    ? risk.penaltyBreakdown.map(row => row.labelZh)
    : ["仍需实验验证"]
  const scoreBreakdown = {
    equation: ORGANIC_ACID_SCORE_EQUATION,
    mode: mode.id,
    modeLabel: mode.label,
    modeLabelZh: mode.labelZh,
    weights,
    dimensions: scores,
    weightedContributions,
    riskPenalty: risk.totalPenalty,
    penaltyBreakdown: risk.penaltyBreakdown,
  }

  return {
    candidateId: candidate.candidateId || candidate.id || candidate.sourceRecordId || candidateName(candidate),
    candidateName: candidateName(candidate),
    targetProduct: taskDefinition.targetProduct,
    finalScore,
    rank,
    pathwayFitScore: scores.pathwayFitScore,
    evidenceScore: scores.evidenceScore,
    graphRelevanceScore: scores.graphRelevanceScore,
    structureSuitabilityScore: scores.structureSuitabilityScore,
    validationReadinessScore: scores.validationReadinessScore,
    dataQualityScore: scores.dataQualityScore,
    riskPenalty: risk.totalPenalty,
    mainReasons,
    mainRisks,
    missingInputs,
    nextExperiment,
    recommendationClass: recommendation,
    scoreBreakdown,
    fieldSources: flattenOrganicAcidFeatureSources(features),
    features,
    risk,
    sourceCandidate: candidate,
    decisionTrace: buildDecisionTrace({
      candidate,
      features,
      scores,
      weightedContributions,
      risk,
      finalScore,
      rank,
      nextExperiment,
    }),
    dataGapSummary: {
      missingCriticalFields: getFeatureNumericValue(features, "missingCriticalFields"),
      missingInputs,
      fieldProvenanceCoverage: getFeatureScore(features, "fieldProvenanceCoverage"),
      syntheticFixtureFlag: Boolean(features.syntheticFixtureFlag?.value),
    },
    boundary: "Algorithmic suggestion only; requires experimental validation.",
    boundaryZh: "仅为算法建议，仍需实验验证。",
  }
}

export default scoreOrganicAcidCandidate
