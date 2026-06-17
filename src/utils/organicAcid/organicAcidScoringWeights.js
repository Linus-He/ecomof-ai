// @ts-nocheck

export const ORGANIC_ACID_SCORE_DIMENSIONS = [
  "pathwayFitScore",
  "evidenceScore",
  "graphRelevanceScore",
  "structureSuitabilityScore",
  "validationReadinessScore",
  "dataQualityScore",
]

export const ORGANIC_ACID_SCORE_EQUATION = "organicAcidFinalScore = pathwayFitScore * 0.25 + evidenceScore * 0.20 + graphRelevanceScore * 0.15 + structureSuitabilityScore * 0.15 + validationReadinessScore * 0.15 + dataQualityScore * 0.10 - riskPenalty"

export const ORGANIC_ACID_SCORING_WEIGHTS = {
  balanced: {
    id: "balanced",
    label: "Balanced",
    labelZh: "均衡模式",
    weights: {
      pathwayFitScore: 0.25,
      evidenceScore: 0.2,
      graphRelevanceScore: 0.15,
      structureSuitabilityScore: 0.15,
      validationReadinessScore: 0.15,
      dataQualityScore: 0.1,
    },
    raises: ["pathwayFitScore", "evidenceScore"],
    lowers: [],
    rankingImpact: "Keeps pathway fit, evidence, graph relevance, structure suitability, validation readiness, and data quality in the default V2.6 balance.",
    rankingImpactZh: "保持路径适配、证据、图论相关性、结构适配、验证就绪度和数据质量的 V2.6 默认平衡。",
  },
  formic_acid_priority: {
    id: "formic_acid_priority",
    label: "Formic Acid Priority",
    labelZh: "甲酸路径优先",
    weights: {
      pathwayFitScore: 0.34,
      evidenceScore: 0.18,
      graphRelevanceScore: 0.14,
      structureSuitabilityScore: 0.13,
      validationReadinessScore: 0.12,
      dataQualityScore: 0.09,
    },
    raises: ["pathwayFitScore", "graphRelevanceScore"],
    lowers: ["validationReadinessScore", "dataQualityScore"],
    rankingImpact: "Moves candidates with strong formic-acid pathway fit and CO2/H-transfer relevance upward while still applying risk penalties.",
    rankingImpactZh: "提高甲酸路径适配、CO2 活化与 H-transfer 相关性强的候选排序，同时继续应用风险惩罚。",
  },
  evidence_first: {
    id: "evidence_first",
    label: "Evidence First",
    labelZh: "证据优先",
    weights: {
      pathwayFitScore: 0.2,
      evidenceScore: 0.3,
      graphRelevanceScore: 0.13,
      structureSuitabilityScore: 0.13,
      validationReadinessScore: 0.14,
      dataQualityScore: 0.1,
    },
    raises: ["evidenceScore", "dataQualityScore"],
    lowers: ["pathwayFitScore", "structureSuitabilityScore"],
    rankingImpact: "Promotes candidates with stronger literature support, mechanism support, and source/citation readiness.",
    rankingImpactZh: "提高文献支持、机制支持、来源与引用就绪度更强的候选。",
  },
  validation_first: {
    id: "validation_first",
    label: "Validation First",
    labelZh: "验证优先",
    weights: {
      pathwayFitScore: 0.19,
      evidenceScore: 0.18,
      graphRelevanceScore: 0.12,
      structureSuitabilityScore: 0.14,
      validationReadinessScore: 0.27,
      dataQualityScore: 0.1,
    },
    raises: ["validationReadinessScore", "dataQualityScore"],
    lowers: ["pathwayFitScore", "graphRelevanceScore"],
    rankingImpact: "Moves lab-testable candidates with compatible conditions and feasible next experiments upward.",
    rankingImpactZh: "提高可实验验证、条件兼容且下一步实验可执行的候选。",
  },
  low_risk_first: {
    id: "low_risk_first",
    label: "Low Risk First",
    labelZh: "低风险优先",
    weights: {
      pathwayFitScore: 0.18,
      evidenceScore: 0.2,
      graphRelevanceScore: 0.11,
      structureSuitabilityScore: 0.22,
      validationReadinessScore: 0.16,
      dataQualityScore: 0.13,
    },
    raises: ["structureSuitabilityScore", "dataQualityScore", "validationReadinessScore"],
    lowers: ["pathwayFitScore", "graphRelevanceScore"],
    rankingImpact: "Penalizes collapse risk, provenance gaps, ambiguity, and missing critical fields more visibly in the ranking.",
    rankingImpactZh: "更明显地压低坍塌风险、溯源缺口、歧义和关键字段缺失较多的候选。",
  },
}

export function resolveOrganicAcidScoringMode(mode = "balanced") {
  return ORGANIC_ACID_SCORING_WEIGHTS[mode] || ORGANIC_ACID_SCORING_WEIGHTS.balanced
}

export function normalizeOrganicAcidWeights(weights = ORGANIC_ACID_SCORING_WEIGHTS.balanced.weights) {
  const raw = { ...ORGANIC_ACID_SCORING_WEIGHTS.balanced.weights, ...(weights || {}) }
  const total = ORGANIC_ACID_SCORE_DIMENSIONS.reduce((sum, key) => sum + Math.max(0, Number(raw[key]) || 0), 0)
  if (!total) return { ...ORGANIC_ACID_SCORING_WEIGHTS.balanced.weights }
  return Object.fromEntries(ORGANIC_ACID_SCORE_DIMENSIONS.map(key => [key, Math.max(0, Number(raw[key]) || 0) / total]))
}
