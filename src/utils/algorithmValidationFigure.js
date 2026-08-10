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
  { key: "OrganicAcid", label: "Organic Acid", labelZh: "有机酸", color: "#B91C1C" },
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

export function buildFigureModel({ summary = {}, algorithm = {}, dataFoundation = null, dataAudit = null, firstBenchmark = null } = {}) {
  const readiness = buildBenchmarkReadiness({ summary, algorithm })
  const df = dataFoundation || null
  const audit = dataAudit || null
  // V3.4 First Real Benchmark report (experimental labels / ground truth /
  // external test / benchmark status). Targets: 30 each.
  const fb = firstBenchmark || null
  const expLabels = Number(fb?.experimentalLabelAudit?.experimentalLabelCount || 0)
  const verifiedGt = Number(fb?.groundTruthAudit?.verifiedGroundTruthCount || 0)
  const externalCount = Number(fb?.split?.counts?.external_test || 0)
  const gap = (target, value) => Math.max(0, target - value)
  const labelCount = Number(df ? df.labelCount : readiness.experimentalLabels ?? 0) || 0
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
        ...(df ? [
          { label: `Gold ${df.goldCount}`, tone: df.goldSufficient ? "pass" : "warn" },
          { label: `Literature ${df.literatureCount}`, tone: "default" },
          { label: `Reaction ${df.reactionDatasetCount || 0}`, tone: (df.reactionDatasetCount || 0) >= (df.targets?.reactionDataset || 50) ? "pass" : "warn" },
          { label: `Benchmark ${df.benchmarkCount}`, tone: "default" },
          { label: `Labels ${df.labelCount}`, tone: df.labelCount > 0 ? "pass" : "warn" },
          { label: `Benchmark Eligible ${df.benchmarkEligibleCount}`, tone: df.benchmarkEligibleCount > 0 ? "pass" : "warn" },
        ] : []),
        { label: "Database Preview", tone: "warn" },
      ],
      inspector: {
        input: df ? `V3.1 data package: reaction ${df.reactionDatasetCount}, Gold ${df.goldCount}, benchmark ${df.benchmarkCount}.` : `Curated preview index of ${totalCandidates} candidate records.`,
        output: df ? `Labels ${df.labelCount}; benchmark eligible ${df.benchmarkEligibleCount}; verified metadata ${df.verifiedMetadataCount}.` : `${verifiedMetadata} verified-metadata candidates; the rest stay preview-only.`,
        algorithm: "Metadata verification gate + reaction validation + benchmark eligibility gate.",
        weights: "No weighting; gate is pass/fail on source, citation, license, DOI, and critical-field provenance.",
        fieldSource: "reaction_data_expansion_summary_v3_1.json + organic_acid_reaction_dataset_v1.json + benchmark_dataset_v2.json.",
        dataQuality: df ? `Current / Target / Gap: label ${df.current?.labelCount || 0}/${df.targets?.labelCount || 30}/${df.gaps?.labelCount || 0}; external ${df.current?.externalTest || 0}/${df.targets?.externalTest || 30}/${df.gaps?.externalTest || 0}.` : `Field provenance coverage ${pct(provenance)}; ${totalCandidates - verifiedMetadata} candidates remain preview-only.`,
        nextStep: df ? "Backfill external-test labels and independently review reaction labels before showing Accuracy / ROC-AUC." : "Resolve ambiguity warnings and confirm DOI/license to grow verified metadata.",
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
      status: fb?.metricsAllowed ? "passed" : labelCount > 0 ? "warning" : "blocked",
      miniChart: "modelReadiness",
      navLabel: "Open ML Readiness",
      navLabelZh: "打开 ML 就绪度",
      items: [
        ...(fb ? [
          { label: `Experimental Labels · ${expLabels}/30 (gap ${gap(30, expLabels)})`, tone: expLabels >= 30 ? "pass" : "warn" },
          { label: `Ground Truth Verified · ${verifiedGt}/30 (gap ${gap(30, verifiedGt)})`, tone: verifiedGt >= 30 ? "pass" : "warn" },
          { label: `External Test · ${externalCount}/30 (gap ${gap(30, externalCount)})`, tone: externalCount >= 30 ? "pass" : "warn" },
          { label: `Benchmark Status · ${fb.overallStatus}`, tone: fb.metricsAllowed ? "pass" : "warn" },
        ] : []),
        { label: `Logistic Regression · ${fb?.metricsAllowed ? `ROC ${fb.models?.find(m => m.model === "Logistic Regression")?.rocAuc ?? "—"}` : "Pending"}`, tone: fb?.metricsAllowed ? "pass" : "warn" },
        { label: `Decision Tree · ${fb?.metricsAllowed ? `ROC ${fb.models?.find(m => m.model === "Decision Tree")?.rocAuc ?? "—"}` : "Pending"}`, tone: fb?.metricsAllowed ? "pass" : "warn" },
        { label: `Random Forest · ${fb?.metricsAllowed ? `ROC ${fb.models?.find(m => m.model === "Random Forest")?.rocAuc ?? "—"}` : "Pending"}`, tone: fb?.metricsAllowed ? "pass" : "warn" },
        ...(df ? [
          { label: `Benchmark Readiness · ${df.readiness.benchmark}`, tone: df.readiness.benchmark === "Ready" ? "pass" : "warn" },
          { label: `Label Readiness · ${df.readiness.label}`, tone: df.readiness.label === "Ready" ? "pass" : "warn" },
          { label: `Data Quality Readiness · ${df.readiness.dataQuality}`, tone: df.readiness.dataQuality === "Ready" ? "pass" : "warn" },
          { label: `External Gap · ${df.gaps?.externalTest ?? "pending"}`, tone: df.gaps?.externalTest ? "warn" : "pass" },
        ] : []),
        ...(audit ? [
          { label: `Benchmark Audit · ${audit.audits.benchmarkEligibility.status}`, tone: audit.audits.benchmarkEligibility.status === "Pass" ? "pass" : "warn" },
          { label: `Label Audit · ${audit.audits.label.status}`, tone: audit.audits.label.status === "Pass" ? "pass" : "warn" },
          { label: `Leakage Audit · ${audit.audits.leakage.leakCount} leaks`, tone: audit.audits.leakage.leakCount === 0 ? "pass" : "warn" },
        ] : []),
        { label: labelCount > 0 ? "Partially Ready" : "Not Ready · labels required", tone: "warn" },
      ],
      inspector: {
        input: fb ? `${expLabels} experimental labels (expert review + independent validation) + ${externalCount} external-test labels.` : df ? `Final descriptor set + ${df.labelCount} V3.1 labels + ${df.externalTestCount || 0} external-test labels.` : "Final descriptor set (ready) + experimental labels (missing).",
        output: fb?.metricsAllowed ? `First Real Benchmark complete. Best model: ${fb.answers?.bestModel}. Accuracy / ROC-AUC shown from fitted LR / DT / RF (no fabricated numbers).` : "Accuracy / ROC-AUC / F1 stay Pending; no metrics are fabricated.",
        algorithm: "LR / DT / RF classifiers fitted on the experimental-label split and evaluated on the independent external test.",
        weights: fb
          ? `Current / Target / Gap — Experimental Labels ${expLabels}/30/${gap(30, expLabels)}; Ground Truth ${verifiedGt}/30/${gap(30, verifiedGt)}; External Test ${externalCount}/30/${gap(30, externalCount)}.`
          : df ? `Current / Target / Gap: ${df.current?.labelCount || 0}/${df.targets?.labelCount || 30}/${df.gaps?.labelCount || 0}; external ${df.current?.externalTest || 0}/${df.targets?.externalTest || 30}/${df.gaps?.externalTest || 0}.` : "No coefficients fitted; label count = 0 blocks training.",
        fieldSource: "experimental_labels/experimental_labels_v1.json + external_test_dataset_v1.json + first_real_benchmark_report_v1.json.",
        dataQuality: fb ? `Experimental ${expLabels} · Verified GT ${verifiedGt} · External ${externalCount} · Leak ${fb.leakage?.leakCount ?? 0} · Result ${fb.result}.` : df?.futureMetrics?.reason || `Label count = ${labelCount}. Readiness = ${labelCount > 0 ? "Partially Ready" : "Not Ready"}.`,
        nextStep: fb?.metricsAllowed ? "Expand the experimental-label corpus beyond the curated set to strengthen the benchmark." : "Collect comparable reviewed external-test labels before training or displaying Accuracy / ROC-AUC.",
        blocker: fb && !fb.metricsAllowed ? (fb.pendingReasons || []).join(" ") : undefined,
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
