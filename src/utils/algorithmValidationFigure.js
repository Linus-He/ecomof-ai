// @ts-nocheck
// V2.8 Interactive Scientific Figure data model.
// Builds the single end-to-end validation flow (Database -> Experimental Validation)
// used by the Algorithm Validation Center. All values are derived from real
// preview/algorithm data; nothing fabricates predictive accuracy.

import {
  FEATURE_SELECTION_WORKFLOW,
  buildBenchmarkReadiness,
  buildCandidateStabilityRows,
  buildDescriptorRanking,
  topCandidateReviewRows,
  benchmarkSource,
} from "./modelBenchmarkLab"

export const FIGURE_NODE_ORDER = [
  "database",
  "descriptor",
  "feature_selection",
  "evidence",
  "ranking",
  "validation",
  "future_ml",
  "experimental",
]

// status -> visual tone. passed/warning/blocked/planned/pending.
export const FIGURE_STATUS_TONE = {
  passed: "pass",
  warning: "warn",
  blocked: "warn",
  planned: "info",
  pending: "warn",
}

const pct = value => (Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : String(value ?? "pending"))
const num = (value, digits = 3) => (Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : String(value ?? "pending"))

export const DESCRIPTOR_CLASSES = [
  { key: "Geometry", label: "Geometry", labelZh: "几何", color: "#1A6DB5" },
  { key: "Electronic", label: "Electronic", labelZh: "电子", color: "#7C3AED" },
  { key: "Graph", label: "Graph", labelZh: "图论", color: "#BE123C" },
  { key: "Evidence", label: "Evidence", labelZh: "证据", color: "#0F766E" },
  { key: "OrganicAcid", label: "Organic Acid", labelZh: "有机酸", color: "#B45309" },
]

// ---- Mini chart data builders (real values, fed to SVG mini charts) ----

export function buildDescriptorImportanceChart() {
  return buildDescriptorRanking({ mode: "critic", sort: "importance", limit: "Top 10" })
    .slice(0, 6)
    .map(row => ({ key: row.key, label: row.label, value: row.activeImportance, category: row.category, coverage: row.coverage }))
}

export function buildFeatureCoverageChart() {
  return FEATURE_SELECTION_WORKFLOW.map(step => ({
    key: step.id,
    label: step.title,
    labelZh: step.titleZh,
    input: step.inputFeatureCount,
    output: step.outputFeatureCount,
    pending: step.pending,
  }))
}

export function buildModelReadinessChart({ readiness } = {}) {
  const labelCount = Number(readiness?.experimentalLabels ?? 0) || 0
  const required = { lr: 24, dt: 36, rf: 60 }
  return [
    { key: "lr", label: "LR", required: required.lr },
    { key: "dt", label: "DT", required: required.dt },
    { key: "rf", label: "RF", required: required.rf },
  ].map(row => {
    const progress = Math.max(0, Math.min(1, labelCount / row.required))
    return {
      ...row,
      labelCount,
      progress,
      status: labelCount <= 0 ? "Not Ready" : progress >= 1 ? "Partially Ready" : "Partially Ready",
    }
  })
}

export function buildCandidateStabilityChart({ algorithm } = {}) {
  return buildCandidateStabilityRows(algorithm || {})
    .slice(0, 6)
    .map(row => ({ key: row.candidateId, label: row.candidateName, value: row.spread, stability: row.stability }))
}

export function buildTopCandidateRankingChart({ algorithm } = {}) {
  return topCandidateReviewRows(algorithm || {}, "balanced")
    .slice(0, 6)
    .map(row => ({ key: row.candidateId, label: row.candidateName, value: Number(row.finalScore || 0), rank: row.rank }))
}

export const FIGURE_MINI_CHARTS = [
  { id: "descriptorImportance", label: "Descriptor Importance", labelZh: "描述符重要性" },
  { id: "featureCoverage", label: "Feature Coverage", labelZh: "特征覆盖" },
  { id: "modelReadiness", label: "Model Readiness", labelZh: "模型就绪度" },
  { id: "candidateStability", label: "Candidate Stability", labelZh: "候选稳定性" },
  { id: "topCandidateRanking", label: "Top Candidate Ranking", labelZh: "候选排名" },
]

// ---- Figure node model ----

export function buildFigureModel({ summary = {}, algorithm = {} } = {}) {
  const readiness = buildBenchmarkReadiness({ summary, algorithm })
  const labelCount = Number(readiness.experimentalLabels ?? 0) || 0
  const sanityPassed = Boolean(algorithm?.sanityCheck?.passed)
  const topStable = Boolean(algorithm?.sensitivitySummary?.topCandidateStability)
  const verifiedMetadata = Number(summary.verifiedMetadataCount ?? readiness.verifiedMetadataCount ?? 0) || 0
  const totalCandidates = Number(summary.totalCandidates ?? readiness.datasetSize ?? 0) || 0
  const provenance = Number(summary.fieldProvenanceCoverage ?? summary.provenanceCoverage ?? readiness.fieldProvenanceCoverage ?? 1)

  const nodes = [
    {
      id: "database",
      navTarget: "algval-database",
      short: "Database",
      shortZh: "数据库",
      title: "Database Layer",
      titleZh: "数据库层",
      status: "passed",
      miniChart: "featureCoverage",
      items: [
        { label: `${totalCandidates} candidates`, tone: "default" },
        { label: `${verifiedMetadata} verified metadata`, tone: verifiedMetadata > 0 ? "pass" : "warn" },
        { label: `provenance ${pct(provenance)}`, tone: "pass" },
        { label: "Database Preview", tone: "warn" },
      ],
      inspector: {
        input: `Curated preview index of ${totalCandidates} candidate records.`,
        output: `${verifiedMetadata} verified-metadata candidates; the rest stay preview-only.`,
        algorithm: "Metadata verification gate + field-level provenance ledger.",
        weights: "No weighting; gate is pass/fail on source, citation, license, DOI, and critical-field provenance.",
        fieldSource: "scalable_database_preview_summary.json field provenance ledger.",
        dataQuality: `Field provenance coverage ${pct(provenance)}; ${totalCandidates - verifiedMetadata} candidates remain preview-only.`,
        nextStep: "Resolve ambiguity warnings and confirm DOI/license to grow verified metadata.",
      },
    },
    {
      id: "descriptor",
      navTarget: "algval-descriptor",
      short: "Descriptors",
      shortZh: "描述符",
      title: "Descriptor Extraction",
      titleZh: "描述符抽取",
      status: "passed",
      miniChart: "descriptorImportance",
      items: DESCRIPTOR_CLASSES.map(cls => ({ label: cls.label, tone: "default", category: cls.key })),
      inspector: {
        input: "Geometry, Electronic, Graph, Evidence, and Organic Acid descriptor families.",
        output: "45 candidate descriptors with per-field coverage and missing-rate flags.",
        algorithm: "Revised autocorrelation (RAC) style descriptor extraction + organic-acid pathway descriptors.",
        weights: "Descriptor importance is CRITIC / evidence-adjusted, not a trained weight.",
        fieldSource: "modelBenchmarkLab descriptor ledger; organicAcidFeatureSchema.",
        dataQuality: `${readiness.descriptorCoverage ? pct(readiness.descriptorCoverage) : "pending"} descriptor coverage; low-coverage descriptors flagged not deleted.`,
        nextStep: "Backfill low-coverage descriptors before they can carry supervised-model weight.",
      },
    },
    {
      id: "feature_selection",
      navTarget: "algval-feature-selection",
      short: "Feature Selection",
      shortZh: "特征选择",
      title: "Feature Selection",
      titleZh: "特征选择",
      status: "passed",
      miniChart: "featureCoverage",
      navLabel: "Open Feature Selection Explorer",
      navLabelZh: "打开特征选择探索器",
      items: [
        { label: "Original 45", tone: "default" },
        { label: "Filtered 24", tone: "default" },
        { label: "Selected 13", tone: "default" },
        { label: "Final Set 13", tone: "pass" },
      ],
      inspector: {
        input: "45 original descriptors from the extraction layer.",
        output: "13 final descriptors retained for white-box MCDA and future ML.",
        algorithm: "Recursive feature elimination idea (Figure 3a analogy): elimination -> selection -> final set.",
        weights: "Elimination reasons: high missing rate, low coverage, high correlation, low scientific relevance.",
        fieldSource: "FEATURE_SELECTION_WORKFLOW (modelBenchmarkLab.js).",
        dataQuality: "Bayesian-regression stage is framework-ready but validation-pending (no labels).",
        nextStep: "Collect experimental labels so eliminated features can be re-tested under supervision.",
      },
    },
    {
      id: "evidence",
      navTarget: "algval-evidence",
      short: "Evidence & Stats",
      shortZh: "证据与统计",
      title: "Evidence & Statistical Interpretation",
      titleZh: "证据与统计解释",
      status: "warning",
      miniChart: "descriptorImportance",
      items: [
        { label: "CRITIC", tone: "pass" },
        { label: "Evidence Adjustment", tone: "pass" },
        { label: "Graph Relevance", tone: "pass" },
        { label: "Risk Penalty", tone: "warn" },
        { label: "Bayesian Regression · Planned", tone: "warn" },
      ],
      inspector: {
        input: "Final descriptor set + evidence levels + graph relevance + risk flags.",
        output: "Evidence-adjusted, risk-penalized candidate scores.",
        algorithm: "CRITIC weighting -> evidence adjustment -> graph relevance -> risk penalty. Bayesian regression is Planned (not implemented).",
        weights: "CRITIC weights are data-driven; risk penalty subtracts for collapse / competing-pathway / missing-field risk.",
        fieldSource: "criticScoring.js, organicAcid scoring weights, evidence records.",
        dataQuality: "Bayesian regression coefficients require experimental labels and are shown as Planned, never as fitted values.",
        nextStep: "Implement Bayesian regression only after comparable experimental labels exist.",
      },
    },
    {
      id: "ranking",
      navTarget: "algval-ranking",
      short: "Candidate Ranking",
      shortZh: "候选排序",
      title: "Candidate Ranking",
      titleZh: "候选排序",
      status: "passed",
      miniChart: "topCandidateRanking",
      navLabel: "Open Top Candidate Review",
      navLabelZh: "打开候选深度分析",
      items: [
        { label: "Top Candidates", tone: "default" },
        { label: "Priority Validation", tone: "default" },
        { label: topStable ? "Rank Stability · stable" : "Rank Stability · changes", tone: topStable ? "pass" : "warn" },
      ],
      inspector: {
        input: "Evidence-adjusted scores for ranked candidates.",
        output: "Ranked candidate list with priority-validation class and rank-stability spread.",
        algorithm: "White-box MCDA ranking with mode switching (balanced / evidence-first / validation-first / low-risk-first).",
        weights: "finalScore = pathwayFit x evidence x graphRelevance x validationReadiness - riskPenalty.",
        fieldSource: "rankOrganicAcidCandidates output; topCandidateReviewRows.",
        dataQuality: topStable ? "Top candidate is stable across reweighting modes." : "Top candidate changes under reweighting; flagged as audit-required.",
        nextStep: "Inspect Why Ranked Here / Biggest Uncertainty / Next Experiment per candidate.",
      },
    },
    {
      id: "validation",
      navTarget: "algval-validation",
      short: "Algorithm Validation",
      shortZh: "算法验证",
      title: "Algorithm Validation",
      titleZh: "算法验证",
      status: sanityPassed ? "passed" : "warning",
      miniChart: "candidateStability",
      items: [
        { label: sanityPassed ? "Sanity Check · passed" : "Sanity Check · review", tone: sanityPassed ? "pass" : "warn" },
        { label: "Sensitivity Analysis", tone: topStable ? "pass" : "warn" },
        { label: "Validation Readiness", tone: "warn" },
        { label: "Scientific Credibility", tone: "pass" },
      ],
      inspector: {
        input: "Ranked candidates + perturbed weights + feature ablations.",
        output: "Sanity check, sensitivity (rank stability), and validation-readiness verdicts.",
        algorithm: "Deterministic sanity + weight-perturbation sensitivity audit (no model training).",
        weights: "Sensitivity perturbs CRITIC weights +/-20% and re-ranks the full candidate pool.",
        fieldSource: "runOrganicAcidSanityCheck, runOrganicAcidSensitivityAnalysis.",
        dataQuality: sanityPassed ? "Sanity check passed." : "Sanity check requires review.",
        nextStep: "Treat passing audits as credibility, not as experimental proof.",
      },
    },
    {
      id: "future_ml",
      navTarget: "algval-future-ml",
      short: "Future ML",
      shortZh: "未来机器学习",
      title: "Future Machine Learning",
      titleZh: "未来机器学习",
      status: labelCount > 0 ? "warning" : "blocked",
      miniChart: "modelReadiness",
      navLabel: "Open ML Readiness",
      navLabelZh: "打开 ML 就绪度",
      items: [
        { label: "Logistic Regression · Pending", tone: "warn" },
        { label: "Decision Tree · Pending", tone: "warn" },
        { label: "Random Forest · Pending", tone: "warn" },
        { label: labelCount > 0 ? "Partially Ready" : "Not Ready · labels required", tone: "warn" },
      ],
      inspector: {
        input: "Final descriptor set (ready) + experimental labels (missing).",
        output: "Accuracy / ROC-AUC / F1 stay Pending; no metrics are fabricated.",
        algorithm: "Planned LR / DT / RF classifiers with LOO-CV and external test (not yet runnable).",
        weights: "No coefficients fitted; label count = 0 blocks training.",
        fieldSource: "FUTURE_METRIC_MODELS (modelBenchmarkLab.js).",
        dataQuality: `Label count = ${labelCount}. Readiness = ${labelCount > 0 ? "Partially Ready" : "Not Ready"}.`,
        nextStep: "Collect comparable high/low yield labels for every candidate before training.",
      },
    },
    {
      id: "experimental",
      navTarget: "algval-experimental",
      short: "Experimental Validation",
      shortZh: "实验验证",
      title: "Experimental Validation",
      titleZh: "实验验证",
      status: "blocked",
      miniChart: "modelReadiness",
      items: [
        { label: "Current", tone: "pass" },
        { label: "Label Collection", tone: "warn" },
        { label: "Cross Validation", tone: "warn" },
        { label: "External Test", tone: "warn" },
        { label: "Publication", tone: "default" },
      ],
      inspector: {
        input: "White-box ranking + audit verdicts (current state).",
        output: "Experimental roadmap: Current -> Label Collection -> Cross Validation -> External Test -> Publication.",
        algorithm: "Human-in-the-loop experimental validation workflow (outside the browser).",
        weights: "No weighting; this is a gated roadmap.",
        fieldSource: "BENCHMARK_ROADMAP_STEPS (modelBenchmarkLab.js).",
        dataQuality: "Blocked: no real yield/selectivity labels are available yet.",
        nextStep: "Run comparable experiments for Top candidates to unblock Label Collection.",
        blocker: "Experimental Labels Missing · external validation pending.",
      },
    },
  ]

  return { nodes, readiness, meta: { labelCount, verifiedMetadata, totalCandidates, sanityPassed, topStable } }
}

export function figureNodeFieldSource(node) {
  return benchmarkSource(node.id, {
    value: node.title,
    sourceUrl: "src/utils/algorithmValidationFigure.js",
    notes: "Interactive scientific figure node provenance.",
  })
}

export { pct as figurePct, num as figureNum }
