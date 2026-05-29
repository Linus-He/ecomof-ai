// @ts-nocheck
import { blendWeights, calculateCriticWeights } from "./criticWeighting"

export const DEFAULT_LOW = 0.05
export const DEFAULT_GATE = 0.5

export const STEP_WEIGHTS = {
  A1: 0.15,
  A2: 0.2,
  A3: 0.35,
  A4: 0.15,
  B1: -0.15,
}

export const BYPRODUCT_MECHANISM_PRIOR = {
  Y_lactic: 1,
  Y_acetic: 0.8,
  Y_glycolic: 0.5,
  Y_pyruvic: 0.4,
  Y_solid: 0.3,
}

export const CRITIC_BLEND_RATIO = {
  mechanism: 0.7,
  critic: 0.3,
}

export const BYPRODUCT_KEYS = Object.keys(BYPRODUCT_MECHANISM_PRIOR)

export const PATHWAY_SCORE_KEYS = [
  "formaldehyde_to_formic",
  "glyceraldehyde_to_formic",
  "glyceraldehyde_to_c2_byproducts",
  "pyruvaldehyde_to_formic",
  "pyruvaldehyde_to_lactic",
]

const REQUIRED_INPUT_KEYS = [
  "Y_FA",
  "S_FA_C",
  "Y_lactic",
  "Y_acetic",
  "Y_glycolic",
  "Y_pyruvic",
  "Y_solid",
  "A1",
  "A2",
  "A3",
  "A4",
  "B1",
  "waterStabilityScore",
  "accessibilityScore",
  "activeSiteConfidence",
  ...PATHWAY_SCORE_KEYS.map(key => `pathwayScores.${key}`),
]

const STEP_LABELS = {
  A1: "葡萄糖活化/异构化能力",
  A2: "甲酸前体生成能力",
  A3: "中间体转甲酸能力",
  A4: "甲酸/甲酸盐释放与稳定能力",
  B1: "副产物路径风险",
}

const recommendationByClass = {
  A: {
    type: "Priority validation / 优先验证候选",
    nextExperiment: [
      "Main reaction test / 主反应测试",
      "Formaldehyde feeding test / 甲醛投料实验",
      "Time-series product analysis / 时间序列产物分析",
      "Carbon balance check / 碳平衡检查",
      "isotopeTracing",
    ],
  },
  B: {
    type: "Optimization candidate / 条件优化候选",
    nextExperiment: [
      "Main reaction test / 主反应测试",
      "Formaldehyde feeding test / 甲醛投料实验",
      "Glyceraldehyde feeding test / 甘油醛投料实验",
      "Time-series product analysis / 时间序列产物分析",
      "Carbon balance check / 碳平衡检查",
    ],
  },
  C: {
    type: "Mechanistic candidate / 机理研究候选",
    nextExperiment: [
      "Glyceraldehyde feeding test / 甘油醛投料实验",
      "Pyruvaldehyde feeding test / 丙酮醛投料实验",
      "DFT adsorption descriptor update / DFT 吸附描述符更新",
      "Carbon balance check / 碳平衡检查",
    ],
  },
  D: {
    type: "Not recommended / 暂不推荐深入",
    nextExperiment: [
      "Control candidate / 对照候选",
      "Data completeness check / 数据完整度检查",
      "Catalyst stability check / 催化剂稳定性检查",
    ],
  },
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clamp01(value, fallback = 0) {
  return Math.max(0, Math.min(1, safeNumber(value, fallback)))
}

function round(value, digits = 3) {
  const number = safeNumber(value, 0)
  const factor = 10 ** digits
  return Math.round(number * factor) / factor
}

function getPathwayScore(item, key) {
  return clamp01(item?.pathwayScores?.[key], 0)
}

function resolveByproductWeights(options = {}) {
  if (options.blendedWeights) return options.blendedWeights
  if (options.byproductWeights) return options.byproductWeights
  if (options.criticAdjustment?.blendedWeights) return options.criticAdjustment.blendedWeights
  return BYPRODUCT_MECHANISM_PRIOR
}

function buildCriticAdjustment(rows = [], options = {}) {
  const mechanismPriorWeights = options.mechanismPriorWeights || BYPRODUCT_MECHANISM_PRIOR
  const blendRatio = options.blendRatio || CRITIC_BLEND_RATIO
  const criticWeights = options.criticWeights || calculateCriticWeights(rows, BYPRODUCT_KEYS).weights
  const blendedWeights = options.blendedWeights || blendWeights(mechanismPriorWeights, criticWeights, blendRatio)
  return {
    mechanismPriorWeights,
    criticWeights,
    blendedWeights,
    blendRatio,
    note: "当前 CRITIC 校正基于原型数据，仅用于方法展示。CRITIC adjustment is calculated from prototype data for demonstration only.",
  }
}

function calculateInputCompleteness(item = {}) {
  const missingFields = REQUIRED_INPUT_KEYS.filter((key) => {
    if (key.startsWith("pathwayScores.")) {
      const pathwayKey = key.replace("pathwayScores.", "")
      return item?.pathwayScores?.[pathwayKey] === undefined || item?.pathwayScores?.[pathwayKey] === null
    }
    return item?.[key] === undefined || item?.[key] === null || item?.[key] === ""
  })
  return {
    availableFields: REQUIRED_INPUT_KEYS.length - missingFields.length,
    totalFields: REQUIRED_INPUT_KEYS.length,
    missingFields,
  }
}

export function calculateGateScore(item = {}) {
  const water = clamp01(item.waterStabilityScore, DEFAULT_GATE)
  const accessibility = clamp01(item.accessibilityScore, DEFAULT_GATE)
  const activeSite = clamp01(item.activeSiteConfidence, DEFAULT_GATE)
  return round(water * accessibility * activeSite)
}

export function calculateStepScore(item = {}) {
  const score = (
    STEP_WEIGHTS.A1 * clamp01(item.A1, DEFAULT_LOW) +
    STEP_WEIGHTS.A2 * clamp01(item.A2, DEFAULT_LOW) +
    STEP_WEIGHTS.A3 * clamp01(item.A3, DEFAULT_LOW) +
    STEP_WEIGHTS.A4 * clamp01(item.A4, DEFAULT_LOW) +
    STEP_WEIGHTS.B1 * clamp01(item.B1, DEFAULT_LOW)
  )

  return round(Math.max(0, score))
}

export function calculateSelectivityFactor(item = {}, options = {}) {
  const weights = resolveByproductWeights(options)
  const yFA = clamp01(item.Y_FA, DEFAULT_LOW)
  const sFAC = clamp01(item.S_FA_C, DEFAULT_LOW)
  const penaltyTerms = BYPRODUCT_KEYS.reduce((sum, key) => (
    sum + safeNumber(weights?.[key], BYPRODUCT_MECHANISM_PRIOR[key]) * clamp01(item[key], 0)
  ), 0)

  const denominator = Math.max(DEFAULT_LOW, 1 + safeNumber(penaltyTerms, 0))
  return round((yFA * sFAC) / denominator)
}

export function calculateRGFAScore(item = {}, options = {}) {
  return round(
    calculateGateScore(item) *
    calculateStepScore(item) *
    calculateSelectivityFactor(item, options),
  )
}

export function classifyCandidate(score, item = {}) {
  const value = safeNumber(score, 0)
  const b1 = clamp01(item.B1, DEFAULT_LOW)
  const a3 = clamp01(item.A3, DEFAULT_LOW)
  const gate = calculateGateScore(item)
  const formaldehydeRoute = getPathwayScore(item, "formaldehyde_to_formic")

  if (value < 0.02 || b1 >= 0.6 || gate < 0.18) return "D"
  if (value >= 0.095 && b1 <= 0.3 && gate >= 0.45) return "A"
  if (value >= 0.05 && b1 <= 0.45) return "B"
  if (value >= 0.03 || a3 >= 0.56 || formaldehydeRoute >= 0.65) return "C"
  return "D"
}

function buildRecommendation(item, trace) {
  const candidateClass = classifyCandidate(trace.rgfaScore.result, item)
  const base = recommendationByClass[candidateClass] || recommendationByClass.D
  const b1 = trace.input.B1
  const gate = trace.gate.result
  const a3 = trace.stepScore.A3.value
  const pyruRisk = trace.pathwayFingerprint.pyruvaldehyde_to_lactic

  let reason = "该候选的推荐类型由 RGFA Score、Gate 初筛、A3 中间体转甲酸能力和 B1 副产物风险共同决定。"
  if (candidateClass === "A") {
    reason = "Gate、A3 与选择性因子均处于较好区间，且 B1 风险较低，适合作为优先验证候选。"
  } else if (candidateClass === "B") {
    reason = "候选具备可优化的甲酸路径信号，但仍需要通过投料实验和时间序列分析确认副产物风险。"
  } else if (candidateClass === "C") {
    reason = a3 >= 0.56 || pyruRisk >= 0.42
      ? "候选具有机理研究价值，但副产物路径或门槛因素限制了优先级。"
      : "候选分数处于较低区间，适合作为机制对照或补充验证。"
  } else if (gate < 0.18 || b1 >= 0.6) {
    reason = "Gate 或 B1 风险未通过原型筛选，不建议作为第一轮深入候选。"
  }

  return {
    class: candidateClass,
    type: base.type,
    nextExperiment: base.nextExperiment,
    reason,
  }
}

function emptyRankingImpact() {
  return {
    yieldOnlyRank: null,
    rgfaRank: null,
    explanation: "排名影响需要候选集上下文；单个候选 trace 仅展示局部计算过程。",
  }
}

export function traceRGFAScore(item = {}, options = {}) {
  const rows = Array.isArray(options.allItems) && options.allItems.length ? options.allItems : [item]
  const criticAdjustment = buildCriticAdjustment(rows, options)
  const input = {
    Y_FA: clamp01(item.Y_FA, DEFAULT_LOW),
    S_FA_C: clamp01(item.S_FA_C, DEFAULT_LOW),
    Y_lactic: clamp01(item.Y_lactic, 0),
    Y_acetic: clamp01(item.Y_acetic, 0),
    Y_glycolic: clamp01(item.Y_glycolic, 0),
    Y_pyruvic: clamp01(item.Y_pyruvic, 0),
    Y_solid: clamp01(item.Y_solid, 0),
    A1: clamp01(item.A1, DEFAULT_LOW),
    A2: clamp01(item.A2, DEFAULT_LOW),
    A3: clamp01(item.A3, DEFAULT_LOW),
    A4: clamp01(item.A4, DEFAULT_LOW),
    B1: clamp01(item.B1, DEFAULT_LOW),
    waterStabilityScore: clamp01(item.waterStabilityScore, DEFAULT_GATE),
    accessibilityScore: clamp01(item.accessibilityScore, DEFAULT_GATE),
    activeSiteConfidence: clamp01(item.activeSiteConfidence, DEFAULT_GATE),
  }

  const gateResult = round(input.waterStabilityScore * input.accessibilityScore * input.activeSiteConfidence)
  const gate = {
    waterStabilityScore: input.waterStabilityScore,
    accessibilityScore: input.accessibilityScore,
    activeSiteConfidence: input.activeSiteConfidence,
    formula: "Gate = waterStabilityScore × accessibilityScore × activeSiteConfidence",
    result: gateResult,
  }

  const pathwayFingerprint = PATHWAY_SCORE_KEYS.reduce((acc, key) => {
    acc[key] = getPathwayScore(item, key)
    return acc
  }, {})

  const stepScore = Object.keys(STEP_WEIGHTS).reduce((acc, key) => {
    const value = input[key]
    const weight = STEP_WEIGHTS[key]
    const contribution = round(value * weight)
    acc[key] = {
      value,
      weight,
      contribution,
      label: STEP_LABELS[key],
    }
    return acc
  }, {})
  stepScore.result = round(Math.max(0, Object.values(stepScore).reduce((sum, term) => sum + safeNumber(term.contribution, 0), 0)))
  stepScore.formula = "StepScore = 0.15A1 + 0.20A2 + 0.35A3 + 0.15A4 − 0.15B1"

  const numerator = round(input.Y_FA * input.S_FA_C)
  const penaltyTerms = BYPRODUCT_KEYS.reduce((acc, key) => {
    const value = input[key]
    const weight = safeNumber(criticAdjustment.blendedWeights?.[key], BYPRODUCT_MECHANISM_PRIOR[key])
    const contribution = round(value * weight)
    acc[key] = { value, weight: round(weight), contribution }
    return acc
  }, {})
  const penaltyTotal = Object.values(penaltyTerms).reduce((sum, term) => sum + safeNumber(term.contribution, 0), 0)
  const denominator = round(1 + penaltyTotal)
  const selectivityFactor = {
    numerator,
    penaltyTerms,
    denominator,
    result: round(numerator / Math.max(DEFAULT_LOW, denominator)),
  }

  const rgfaScore = {
    gate: gate.result,
    stepScore: stepScore.result,
    selectivityFactor: selectivityFactor.result,
    formula: "RGFA Score = Gate × StepScore × SelectivityFactor",
    result: round(gate.result * stepScore.result * selectivityFactor.result),
  }

  const partialTrace = {
    input,
    inputCompleteness: calculateInputCompleteness(item),
    gate,
    pathwayFingerprint,
    stepScore,
    selectivityFactor,
    criticAdjustment,
    rgfaScore,
    rankingImpact: emptyRankingImpact(),
  }

  const rankingContext = options.rankingContext || null
  if (rankingContext) {
    const mof = item.mof
    const yieldOnlyRank = rankingContext.yieldOnlyRankByMof?.get?.(mof) || null
    const rgfaRank = rankingContext.rgfaRankByMof?.get?.(mof) || null
    partialTrace.rankingImpact = {
      yieldOnlyRank,
      rgfaRank,
      explanation: yieldOnlyRank && rgfaRank
        ? `如果只看甲酸产率，该候选为第 ${yieldOnlyRank} 位；综合 Gate、路径风险、选择性和 CRITIC 校正后为第 ${rgfaRank} 位。`
        : "候选排名上下文不足，暂不显示排名变化。",
    }
  }

  partialTrace.recommendation = buildRecommendation(item, partialTrace)
  return partialTrace
}

export function generateCandidateExplanation(item = {}, traceInput = null) {
  const trace = traceInput || traceRGFAScore(item)
  const explanations = []
  const a3 = trace.stepScore.A3.value
  const b1 = trace.input.B1
  const gate = trace.gate.result
  const selectivity = trace.selectivityFactor.result
  const formaldehydeRoute = trace.pathwayFingerprint.formaldehyde_to_formic
  const glyceraldehydeRisk = trace.pathwayFingerprint.glyceraldehyde_to_c2_byproducts
  const pyruvaldehydeRisk = trace.pathwayFingerprint.pyruvaldehyde_to_lactic

  if (a3 >= 0.75) {
    explanations.push("A3 中间体转甲酸能力较强，是该候选进入前列的主要机理依据。")
  } else if (a3 >= 0.62) {
    explanations.push("A3 处于中等偏上区间，适合用甲醛/甘油醛投料实验继续确认。")
  } else {
    explanations.push("A3 仍偏弱，说明中间体是否能导向甲酸需要优先验证。")
  }

  if (b1 <= 0.3) {
    explanations.push("B1 副产物路径风险较低，对 RGFA Score 的扣分有限。")
  } else if (b1 >= 0.5) {
    explanations.push("B1 风险较高，乳酸、丙酮酸或 C2 副产物路径可能拉低排名。")
  } else {
    explanations.push("B1 风险可控但不可忽略，建议加入时间序列产物分析。")
  }

  if (formaldehydeRoute >= 0.72) {
    explanations.push("路径指纹显示甲醛 → 甲酸主正路径较强，与当前三路径机理假设一致。")
  } else if (glyceraldehydeRisk >= 0.4) {
    explanations.push("甘油醛混合路径中的 C2 副产物分支较明显，需关注乙醇酸/乙酸泄漏。")
  } else if (pyruvaldehydeRisk >= 0.45) {
    explanations.push("丙酮醛风险路径较强，需用丙酮醛投料实验验证乳酸/丙酮酸风险。")
  }

  if (gate >= 0.45) {
    explanations.push("Gate 初筛通过，水相稳定性、可及性和活性位点可信度支持进入反应筛选。")
  } else {
    explanations.push("Gate 初筛偏低，水相稳定性或孔道可及性需要先确认。")
  }

  if (selectivity >= 0.3) {
    explanations.push("选择性因子较高，说明甲酸产率和碳选择性未被副产物惩罚显著抵消。")
  } else {
    explanations.push("选择性因子仍受副产物惩罚影响，单看甲酸产率可能高估该候选。")
  }

  if (trace.rankingImpact.yieldOnlyRank && trace.rankingImpact.rgfaRank && trace.rankingImpact.yieldOnlyRank !== trace.rankingImpact.rgfaRank) {
    explanations.push(`排序从产率第 ${trace.rankingImpact.yieldOnlyRank} 位变为 RGFA 第 ${trace.rankingImpact.rgfaRank} 位，体现了路径风险和门槛分数的影响。`)
  }

  return explanations
}

export function calculateYieldOnlyRanking(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(item => ({
      ...item,
      yieldOnlyScore: round(clamp01(item.Y_FA, DEFAULT_LOW)),
    }))
    .sort((a, b) => (
      safeNumber(b.yieldOnlyScore, 0) - safeNumber(a.yieldOnlyScore, 0)
      || safeNumber(b.S_FA_C, 0) - safeNumber(a.S_FA_C, 0)
      || String(a.mof || "").localeCompare(String(b.mof || ""))
    ))
    .map((item, index) => ({
      ...item,
      yieldOnlyRank: index + 1,
    }))
}

export function calculateRGFARanking(items = [], options = {}) {
  const rows = Array.isArray(items) ? items : []
  const criticModel = calculateCriticWeights(rows, BYPRODUCT_KEYS)
  const criticWeights = options.criticWeights || criticModel.weights
  const blendedWeights = options.blendedWeights || blendWeights(
    options.mechanismPriorWeights || BYPRODUCT_MECHANISM_PRIOR,
    criticWeights,
    options.blendRatio || CRITIC_BLEND_RATIO,
  )
  const yieldRanking = calculateYieldOnlyRanking(rows)
  const yieldOnlyRankByMof = new Map(yieldRanking.map(item => [item.mof, item.yieldOnlyRank]))

  const tracedRows = rows.map((item) => {
    const trace = traceRGFAScore(item, {
      ...options,
      allItems: rows,
      criticWeights,
      blendedWeights,
    })
    return {
      ...item,
      trace,
      gateScore: trace.gate.result,
      stepScore: trace.stepScore.result,
      selectivityFactor: trace.selectivityFactor.result,
      rgfaScore: trace.rgfaScore.result,
      computedClass: trace.recommendation.class,
      yieldOnlyRank: yieldOnlyRankByMof.get(item.mof) || null,
    }
  })

  const sorted = tracedRows
    .sort((a, b) => (
      safeNumber(b.rgfaScore, 0) - safeNumber(a.rgfaScore, 0)
      || safeNumber(b.Y_FA, 0) - safeNumber(a.Y_FA, 0)
      || String(a.mof || "").localeCompare(String(b.mof || ""))
    ))

  const rgfaRankByMof = new Map(sorted.map((item, index) => [item.mof, index + 1]))
  const rankingContext = { yieldOnlyRankByMof, rgfaRankByMof }

  return sorted.map((item, index) => {
    const trace = traceRGFAScore(item, {
      ...options,
      allItems: rows,
      criticWeights,
      blendedWeights,
      rankingContext,
    })
    return {
      ...item,
      rgfaRank: index + 1,
      rankDelta: safeNumber(item.yieldOnlyRank, index + 1) - (index + 1),
      trace,
      gateScore: trace.gate.result,
      stepScore: trace.stepScore.result,
      selectivityFactor: trace.selectivityFactor.result,
      rgfaScore: trace.rgfaScore.result,
      computedClass: trace.recommendation.class,
      recommendation: trace.recommendation,
      explanations: generateCandidateExplanation(item, trace),
      criticAdjustment: trace.criticAdjustment,
    }
  })
}
