// @ts-nocheck

import { rankOrganicAcidCandidates } from "./organicAcid/rankOrganicAcidCandidates"

export const BENCHMARK_MODES = [
  { id: "balanced", label: "balanced", labelZh: "balanced / 均衡" },
  { id: "evidence_first", label: "evidence first", labelZh: "evidence first / 证据优先" },
  { id: "validation_first", label: "validation first", labelZh: "validation first / 验证优先" },
  { id: "low_risk_first", label: "low risk first", labelZh: "low risk first / 低风险优先" },
]

export const BENCHMARK_METRICS = [
  "Interpretability",
  "Data Requirement",
  "Label Requirement",
  "Current Readiness",
  "Future Accuracy",
  "Future ROC-AUC",
]

export const DESCRIPTOR_CATEGORIES = [
  "Geometry",
  "Electronic",
  "Metal",
  "Linker",
  "Evidence",
  "Graph",
  "Validation",
]

export const CATEGORY_COLORS = {
  Geometry: "#1A6DB5",
  Electronic: "#7C3AED",
  Metal: "#B45309",
  Linker: "#15803D",
  Evidence: "#0F766E",
  Graph: "#BE123C",
  Validation: "#64748B",
}

export const FEATURE_SELECTION_WORKFLOW = [
  {
    id: "original_features",
    title: "Original Features",
    titleZh: "原始特征",
    inputFeatureCount: 45,
    outputFeatureCount: 45,
    deletedReasons: ["none"],
    currentStatus: "implemented",
    implemented: true,
    pending: false,
    fieldKeys: ["surfaceArea", "poreVolume", "poreSizeA", "density", "voidFraction", "bandGap"],
    nextData: "持续补齐字段来源、单位和缺失原因。",
    nextDataEn: "Keep filling field sources, units, and missing reasons.",
  },
  {
    id: "feature_elimination",
    title: "Feature Elimination",
    titleZh: "特征剔除",
    inputFeatureCount: 45,
    outputFeatureCount: 24,
    deletedReasons: ["High Missing Rate", "Low Coverage", "High Correlation", "Low Scientific Relevance"],
    currentStatus: "implemented",
    implemented: true,
    pending: false,
    fieldKeys: ["density", "voidFraction", "topology"],
    nextData: "需要更多非合成记录来区分真实缺失和导入缺失。",
    nextDataEn: "More non-synthetic records are needed to separate real gaps from import gaps.",
  },
  {
    id: "bayesian_regression",
    title: "Bayesian Regression",
    titleZh: "贝叶斯回归",
    inputFeatureCount: 24,
    outputFeatureCount: 13,
    deletedReasons: ["Low Evidence Support", "Coefficient uncertainty", "No experimental label"],
    currentStatus: "framework ready; validation pending",
    implemented: true,
    pending: true,
    fieldKeys: ["formicAcidPathwayFit", "evidenceLevel", "validationReadiness"],
    nextData: "需要带甲酸产率/选择性的实验标签，才可拟合系数。",
    nextDataEn: "Experimental formic-acid yield/selectivity labels are required before coefficients can be fitted.",
  },
  {
    id: "final_features",
    title: "Final Features",
    titleZh: "最终描述符集",
    inputFeatureCount: 13,
    outputFeatureCount: 13,
    deletedReasons: ["kept for white-box MCDA and future ML benchmark"],
    currentStatus: "implemented",
    implemented: true,
    pending: false,
    fieldKeys: ["surfaceArea", "poreVolume", "poreSizeA", "bandGap", "metalNode", "linker"],
    nextData: "补齐字段级来源后可作为未来监督学习输入。",
    nextDataEn: "After field provenance is complete, this can become supervised-learning input.",
  },
  {
    id: "machine_learning",
    title: "Machine Learning",
    titleZh: "机器学习",
    inputFeatureCount: 13,
    outputFeatureCount: 0,
    deletedReasons: ["Experimental Labels Missing"],
    currentStatus: "pending",
    implemented: false,
    pending: true,
    fieldKeys: ["experimentalLabel", "yield", "selectivity"],
    nextData: "需要真实实验标签、条件可比性和外部测试集。",
    nextDataEn: "Requires real labels, condition comparability, and an external test set.",
  },
  {
    id: "confusion_roc",
    title: "Confusion Matrix / ROC",
    titleZh: "混淆矩阵 / ROC",
    inputFeatureCount: 0,
    outputFeatureCount: 0,
    deletedReasons: ["Experimental labels required", "External validation required"],
    currentStatus: "pending",
    implemented: false,
    pending: true,
    fieldKeys: ["accuracy", "rocAuc", "externalTest"],
    nextData: "需要已标注样本、LOO-CV 设置和外部测试数据。",
    nextDataEn: "Requires labeled samples, LOO-CV setup, and external test data.",
  },
]

export const DESCRIPTOR_IMPORTANCE_ROWS = [
  {
    key: "surfaceArea",
    label: "surfaceArea",
    labelZh: "比表面积",
    category: "Geometry",
    explanationZh: "影响孔内可达性和候选结构适配，不等于催化活性证明。",
    explanation: "Influences pore accessibility and structure suitability; it is not proof of catalytic activity.",
    criticImportance: 0.86,
    evidenceAdjustedImportance: 0.78,
    organicAcidRelevance: 0.74,
    dataQualityImpact: 0.82,
    coverage: 0.94,
    frequency: 0.82,
    evidenceSupport: "medium",
  },
  {
    key: "poreVolume",
    label: "poreVolume",
    labelZh: "孔体积",
    category: "Geometry",
    explanationZh: "用于判断中间体空间约束和扩散风险。",
    explanation: "Used for intermediate confinement and diffusion-risk context.",
    criticImportance: 0.82,
    evidenceAdjustedImportance: 0.75,
    organicAcidRelevance: 0.79,
    dataQualityImpact: 0.78,
    coverage: 0.91,
    frequency: 0.77,
    evidenceSupport: "medium",
  },
  {
    key: "poreSizeA",
    label: "poreSizeA",
    labelZh: "孔径",
    category: "Geometry",
    explanationZh: "对应 formate 路径的孔径/可达性 proxy。",
    explanation: "A pore-accessibility proxy for the formate pathway.",
    criticImportance: 0.8,
    evidenceAdjustedImportance: 0.74,
    organicAcidRelevance: 0.82,
    dataQualityImpact: 0.76,
    coverage: 0.9,
    frequency: 0.74,
    evidenceSupport: "medium",
  },
  {
    key: "density",
    label: "density",
    labelZh: "密度",
    category: "Geometry",
    explanationZh: "辅助判断结构紧密度和冗余描述符关系。",
    explanation: "Helps evaluate structural compactness and descriptor redundancy.",
    criticImportance: 0.7,
    evidenceAdjustedImportance: 0.62,
    organicAcidRelevance: 0.56,
    dataQualityImpact: 0.7,
    coverage: 0.88,
    frequency: 0.58,
    evidenceSupport: "low",
  },
  {
    key: "voidFraction",
    label: "voidFraction",
    labelZh: "空隙率",
    category: "Geometry",
    explanationZh: "与孔体积共线，需要在特征剔除阶段审计。",
    explanation: "Correlated with pore volume and should be audited during feature elimination.",
    criticImportance: 0.66,
    evidenceAdjustedImportance: 0.6,
    organicAcidRelevance: 0.58,
    dataQualityImpact: 0.68,
    coverage: 0.86,
    frequency: 0.55,
    evidenceSupport: "low",
  },
  {
    key: "bandGap",
    label: "bandGap",
    labelZh: "带隙",
    category: "Electronic",
    explanationZh: "电子结构 proxy，当前更适合用于可解释性而非监督预测。",
    explanation: "Electronic proxy, currently useful for interpretation rather than supervised prediction.",
    criticImportance: 0.74,
    evidenceAdjustedImportance: 0.68,
    organicAcidRelevance: 0.61,
    dataQualityImpact: 0.65,
    coverage: 0.8,
    frequency: 0.62,
    evidenceSupport: "low",
  },
  {
    key: "metalNode",
    label: "metalNode",
    labelZh: "金属节点",
    category: "Metal",
    explanationZh: "影响 Lewis acid / active-site 解释，是机理假设字段。",
    explanation: "Supports Lewis-acid / active-site interpretation as a mechanism hypothesis field.",
    criticImportance: 0.78,
    evidenceAdjustedImportance: 0.76,
    organicAcidRelevance: 0.84,
    dataQualityImpact: 0.72,
    coverage: 0.9,
    frequency: 0.7,
    evidenceSupport: "medium",
  },
  {
    key: "linker",
    label: "linker",
    labelZh: "连接体",
    category: "Linker",
    explanationZh: "对应微环境匹配与质子/甲酸盐稳定 proxy。",
    explanation: "Represents microenvironment fit and formate/proton stabilization proxies.",
    criticImportance: 0.73,
    evidenceAdjustedImportance: 0.7,
    organicAcidRelevance: 0.77,
    dataQualityImpact: 0.66,
    coverage: 0.76,
    frequency: 0.64,
    evidenceSupport: "medium",
  },
  {
    key: "topology",
    label: "topology",
    labelZh: "拓扑",
    category: "Graph",
    explanationZh: "与图论相关性和结构多样性有关。",
    explanation: "Connects graph relevance and structure diversity.",
    criticImportance: 0.63,
    evidenceAdjustedImportance: 0.58,
    organicAcidRelevance: 0.66,
    dataQualityImpact: 0.62,
    coverage: 0.72,
    frequency: 0.5,
    evidenceSupport: "low",
  },
  {
    key: "formicAcidPathwayFit",
    label: "formicAcidPathwayFit",
    labelZh: "甲酸路径适配",
    category: "Evidence",
    explanationZh: "V2.6 目标函数中的路径适配核心字段。",
    explanation: "Core pathway-fit field in the V2.6 objective function.",
    criticImportance: 0.76,
    evidenceAdjustedImportance: 0.84,
    organicAcidRelevance: 0.94,
    dataQualityImpact: 0.79,
    coverage: 0.68,
    frequency: 0.72,
    evidenceSupport: "medium",
  },
  {
    key: "graphCentrality",
    label: "graphCentrality",
    labelZh: "图中心性",
    category: "Graph",
    explanationZh: "解释候选在机制/证据图中的相关性，不是模型预测精度。",
    explanation: "Explains relevance in mechanism/evidence graphs; it is not predictive accuracy.",
    criticImportance: 0.62,
    evidenceAdjustedImportance: 0.72,
    organicAcidRelevance: 0.8,
    dataQualityImpact: 0.67,
    coverage: 0.7,
    frequency: 0.57,
    evidenceSupport: "medium",
  },
  {
    key: "evidenceLevel",
    label: "evidenceLevel",
    labelZh: "证据等级",
    category: "Evidence",
    explanationZh: "用于下调低证据候选，避免把 proxy 当成真实标签。",
    explanation: "Down-weights low-evidence candidates so proxies are not treated as labels.",
    criticImportance: 0.65,
    evidenceAdjustedImportance: 0.9,
    organicAcidRelevance: 0.86,
    dataQualityImpact: 0.85,
    coverage: 0.74,
    frequency: 0.76,
    evidenceSupport: "high",
  },
  {
    key: "validationReadiness",
    label: "validationReadiness",
    labelZh: "验证就绪度",
    category: "Validation",
    explanationZh: "决定候选能否进入 priority_validation，而不是实验已经验证。",
    explanation: "Determines whether a candidate can enter priority_validation; it does not mean validation is complete.",
    criticImportance: 0.58,
    evidenceAdjustedImportance: 0.82,
    organicAcidRelevance: 0.83,
    dataQualityImpact: 0.88,
    coverage: 0.66,
    frequency: 0.68,
    evidenceSupport: "medium",
  },
]

export const MODEL_COMPARISON_ROWS = [
  {
    id: "critic",
    label: "CRITIC",
    type: "white-box MCDA",
    interpretability: "High",
    dataRequirement: "Low",
    labelRequirement: "No labels required for ranking explanation",
    currentReadiness: "Implemented",
    scientificUsefulness: "Transparent descriptor weighting",
  },
  {
    id: "evidence_critic",
    label: "Evidence-CRITIC",
    type: "white-box MCDA + evidence adjustment",
    interpretability: "High",
    dataRequirement: "Medium",
    labelRequirement: "No labels required; evidence provenance required",
    currentReadiness: "Implemented",
    scientificUsefulness: "Evidence-aware ranking explanation",
  },
  {
    id: "bayesian_regression",
    label: "Bayesian Regression",
    type: "supervised baseline",
    interpretability: "Medium",
    dataRequirement: "Medium",
    labelRequirement: "Experimental yield/selectivity labels required",
    currentReadiness: "Framework Ready",
    scientificUsefulness: "Coefficient uncertainty once labels exist",
  },
  {
    id: "lr",
    label: "Logistic Regression",
    type: "classification baseline",
    interpretability: "Medium",
    dataRequirement: "Medium",
    labelRequirement: "Binary high/low labels required",
    currentReadiness: "Pending Validation",
    scientificUsefulness: "Simple LOO-CV baseline after labels",
  },
  {
    id: "dt",
    label: "Decision Tree",
    type: "classification baseline",
    interpretability: "Medium",
    dataRequirement: "Medium",
    labelRequirement: "Binary labels required",
    currentReadiness: "Pending Validation",
    scientificUsefulness: "Readable split rules after labels",
  },
  {
    id: "rf",
    label: "Random Forest",
    type: "classification baseline",
    interpretability: "Low-Medium",
    dataRequirement: "High",
    labelRequirement: "More labels required than LR/DT",
    currentReadiness: "Pending Validation",
    scientificUsefulness: "Future nonlinear robustness check",
  },
]

export const FUTURE_METRIC_MODELS = [
  {
    id: "lr",
    label: "LR",
    labelLong: "Logistic Regression",
    labelsRequired: 24,
    experimentalData: "甲酸产率、甲酸选择性、反应温度、时间、金属负载、重复实验误差。",
    blocker: "Experimental labels required",
    validationPlan: "Leave-One-Out Cross Validation after every candidate has comparable binary labels.",
    looCv: false,
    externalTest: false,
  },
  {
    id: "dt",
    label: "DT",
    labelLong: "Decision Tree",
    labelsRequired: 36,
    experimentalData: "同一阈值下的 high/low 标签、结构描述符、证据等级和条件可比性。",
    blocker: "Experimental labels required",
    validationPlan: "LOO-CV first, then prune tree depth under sparse-label setting.",
    looCv: false,
    externalTest: false,
  },
  {
    id: "rf",
    label: "RF",
    labelLong: "Random Forest",
    labelsRequired: 60,
    experimentalData: "更大标签集、重复实验、外部测试候选和条件归一化。",
    blocker: "Experimental labels and external test required",
    validationPlan: "Use RF only after LR/DT baselines and external set exist.",
    looCv: false,
    externalTest: false,
  },
  {
    id: "evidence_critic",
    label: "Evidence-CRITIC",
    labelLong: "Evidence-adjusted CRITIC",
    labelsRequired: 0,
    experimentalData: "不需要标签即可解释排序；需要标签才可报告未来 Accuracy / ROC-AUC。",
    blocker: "Predictive metric labels missing",
    validationPlan: "Use as transparent ranking baseline when supervised labels become available.",
    looCv: false,
    externalTest: false,
  },
]

export const BENCHMARK_ROADMAP_STEPS = [
  ["Current Framework", "ready", "White-box MCDA, evidence adjustment, graph relevance, risk penalty, and field provenance are implemented."],
  ["Experimental Dataset", "pending", "Collect comparable experiments for Top candidates."],
  ["Label Collection", "blocked", "No real yield/selectivity labels are available yet."],
  ["Cross Validation", "blocked", "LOO-CV requires at least one label per held-out candidate."],
  ["Model Benchmark", "blocked", "Accuracy and ROC-AUC are hidden until labels exist."],
  ["External Test", "blocked", "External validation requires independent held-out data."],
  ["Publication", "planned", "Publish only after benchmark metrics and evidence boundary are defensible."],
].map(([title, status, detail], index) => ({ id: `roadmap_${index + 1}`, title, status, detail }))

export function benchmarkSource(field, overrides = {}) {
  return {
    value: overrides.value ?? field,
    sourceDatabase: overrides.sourceDatabase || "EcoMOF-AI V2.8 Algorithm Validation Center",
    sourceRecordId: overrides.sourceRecordId || field,
    sourceUrl: overrides.sourceUrl || "src/utils/modelBenchmarkLab.js",
    citation: overrides.citation || "Su et al. 2025 inspired workflow analogy; EcoMOF-AI implementation data.",
    license: overrides.license || "Project repository license context.",
    retrievedAt: overrides.retrievedAt || "2026-06-18",
    curationStatus: overrides.curationStatus || "confirmed",
    confidence: overrides.confidence ?? 0.78,
    status: overrides.status || "ready",
    scoringEligible: overrides.scoringEligible ?? true,
    blocksVerifiedMetadata: overrides.blocksVerifiedMetadata ?? false,
    notes: overrides.notes || "Field-level provenance retained for benchmark interpretation.",
  }
}

export function descriptorModeValue(row, mode = "critic") {
  const key = {
    critic: "criticImportance",
    evidence: "evidenceAdjustedImportance",
    organic: "organicAcidRelevance",
    quality: "dataQualityImpact",
  }[mode] || "criticImportance"
  return Number(row[key] || 0)
}

export function buildDescriptorRanking({ mode = "critic", category = "All", sort = "importance", limit = "Top 10" } = {}) {
  const maxRows = limit === "Top 20" ? 20 : limit === "All" ? DESCRIPTOR_IMPORTANCE_ROWS.length : 10
  return DESCRIPTOR_IMPORTANCE_ROWS
    .filter(row => category === "All" || row.category === category)
    .map(row => ({ ...row, activeImportance: descriptorModeValue(row, mode), source: benchmarkSource(row.key, { value: row.label }) }))
    .sort((a, b) => {
      if (sort === "category") return a.category.localeCompare(b.category) || b.activeImportance - a.activeImportance
      if (sort === "coverage") return b.coverage - a.coverage
      return b.activeImportance - a.activeImportance
    })
    .slice(0, maxRows)
}

export function metricValueForModel(model, metric, { labelCount = 0 } = {}) {
  if (metric === "Interpretability") return { value: model.interpretability, pending: false }
  if (metric === "Data Requirement") return { value: model.dataRequirement, pending: false }
  if (metric === "Label Requirement") return { value: model.labelRequirement, pending: false }
  if (metric === "Current Readiness") return { value: model.currentReadiness, pending: false }
  if (metric === "Future Accuracy" || metric === "Future ROC-AUC") {
    return {
      value: "Pending",
      pending: true,
      explanation: labelCount > 0 ? "Benchmark labels still require validation split." : "Experimental labels required",
      explanationZh: labelCount > 0 ? "已有标签仍需验证集划分。" : "需要真实实验标签。",
    }
  }
  return { value: "Pending", pending: true, explanation: "Experimental labels required", explanationZh: "需要真实实验标签。" }
}

export function buildBenchmarkReadiness({ summary = {}, algorithm = {} } = {}) {
  const datasetSize = Number(summary.totalCandidates ?? summary.candidateCount ?? 1000) || 1000
  const verifiedMetadataCount = Number(summary.verifiedMetadataCount ?? summary.verifiedMetadataCandidates ?? 30) || 0
  const fieldProvenanceCoverage = Number(summary.fieldProvenanceCoverage ?? summary.provenanceCoverage ?? 1)
  const dataQualityScore = Number(summary.recordQualityScore ?? summary.dataQualityScore ?? 0.78)
  const labelCount = Number(summary.experimentalLabelCount ?? summary.labelCount ?? 0) || 0
  const descriptorCoverage = Number(summary.descriptorCoverage ?? 0.86)
  const candidateCount = Number(algorithm.scoringSummary?.candidateCount ?? algorithm.rankedCandidates?.length ?? 0)

  return {
    currentStage: "Benchmark Framework Ready",
    machineLearningReady: labelCount > 0 && datasetSize >= 24 ? "Partially Ready" : "Not Ready",
    experimentalLabels: labelCount,
    benchmarkStatus: "Framework Ready",
    validationStatus: "Experimental Validation Pending",
    datasetSize,
    candidateCount,
    verifiedMetadataCount,
    fieldProvenanceCoverage,
    dataQualityScore,
    descriptorCoverage,
    status: labelCount === 0 ? "Not Ready" : "Partially Ready",
    mainBlocker: labelCount === 0 ? "Experimental Labels Missing" : "External validation split pending",
  }
}

function sourceCandidatesFromAlgorithm(algorithm = {}) {
  const rows = algorithm.rankedCandidates || algorithm.topCandidates || []
  return rows.map(row => row.sourceCandidate || row.candidate || row).filter(Boolean)
}

export function rankCandidatesForBenchmark(algorithm = {}, mode = "balanced") {
  const candidates = sourceCandidatesFromAlgorithm(algorithm)
  if (!candidates.length) return []
  return rankOrganicAcidCandidates({ candidates, scoringMode: mode, topN: 10 }).rankedCandidates
}

export function buildCandidateStabilityRows(algorithm = {}) {
  const baseRows = algorithm.rankedCandidates || []
  const modes = BENCHMARK_MODES.map(mode => mode.id)
  const rankMaps = Object.fromEntries(modes.map(mode => [
    mode,
    new Map(topCandidateReviewRows(algorithm, mode).map(row => [row.candidateId, row.rank])),
  ]))
  return baseRows.slice(0, 10).map(row => {
    const ranks = modes.map(mode => rankMaps[mode]?.get(row.candidateId)).filter(Number.isFinite)
    const min = Math.min(...ranks, row.rank || 99)
    const max = Math.max(...ranks, row.rank || 99)
    const spread = max - min
    const stability = spread <= 1 ? "Highly Stable" : spread <= 3 ? "Moderately Stable" : "Unstable"
    return {
      candidateId: row.candidateId,
      candidateName: row.candidateName,
      ranks: Object.fromEntries(modes.map(mode => [mode, rankMaps[mode]?.get(row.candidateId) ?? "pending"])),
      spread,
      stability,
    }
  })
}

export function topCandidateReviewRows(algorithm = {}, mode = "balanced") {
  const rows = rankCandidatesForBenchmark(algorithm, mode)
  const sourceRows = (rows.length ? rows : algorithm.rankedCandidates || []).slice(0, 10)
  const scoredRows = [...sourceRows]
  const byFinalScore = (a, b) => Number(b.finalScore || 0) - Number(a.finalScore || 0)

  if (mode === "evidence_first") {
    scoredRows.sort((a, b) => (
      Number(b.evidenceScore || 0) - Number(a.evidenceScore || 0)
      || Number(b.graphRelevanceScore || 0) - Number(a.graphRelevanceScore || 0)
      || byFinalScore(a, b)
    ))
  } else if (mode === "validation_first") {
    scoredRows.sort((a, b) => (
      Number(b.validationReadinessScore || 0) - Number(a.validationReadinessScore || 0)
      || Number(b.evidenceScore || 0) - Number(a.evidenceScore || 0)
      || byFinalScore(a, b)
    ))
  } else if (mode === "low_risk_first") {
    scoredRows.sort((a, b) => (
      Number(a.riskPenalty || 0) - Number(b.riskPenalty || 0)
      || Number(b.validationReadinessScore || 0) - Number(a.validationReadinessScore || 0)
      || byFinalScore(a, b)
    ))
  }

  return scoredRows.map((row, index) => ({
    ...row,
    originalRank: row.rank,
    rank: index + 1,
    benchmarkMode: mode,
  }))
}
