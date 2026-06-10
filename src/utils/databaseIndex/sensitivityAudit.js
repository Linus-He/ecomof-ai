// @ts-nocheck
// V2.0-H Sensitivity Audit.
//
// Lightweight, DETERMINISTIC audit that tests whether the preview candidate ordering
// is stable under weight perturbation, redundancy-penalty toggling, mechanism-proxy
// toggling, and metadata-gate changes. It is an independent audit only: it does NOT
// change OACS/DMRS scoring, it reports ranking stability (not predictive precision), it never reports
// R^2 / MAE / RMSE, and it is never a final recommendation.
import {
  PREVIEW_FEATURE_KEYS,
  buildPreviewFeatureMatrix,
  defaultPreviewWeights,
  mulberry32,
  rankRecords,
  topNOverlap,
} from "./previewRanking.js"
import { buildRedundancyWeightPenalty, buildDescriptorRedundancySummary } from "./descriptorRedundancyGate.js"

function topN(list, n) {
  return list.slice(0, n)
}

// Audit 1: perturb feature weights by +/- range over N deterministic runs.
export function runWeightPerturbationAudit(records = [], options = {}) {
  const matrix = buildPreviewFeatureMatrix(records)
  const auditRuns = options.auditRuns || 100
  const range = options.perturbationRange ?? 0.2
  const seed = options.seed ?? 170
  const base = defaultPreviewWeights()
  const baseRanking = rankRecords(matrix, base)
  const baseTop5 = topN(baseRanking, 5)
  const baseTop10 = topN(baseRanking, 10)

  const random = mulberry32(seed)
  let top5RetentionSum = 0
  let top10RetentionSum = 0
  const membershipFlips = {}
  for (const id of [...baseTop5, ...baseTop10]) membershipFlips[id] = 0

  for (let run = 0; run < auditRuns; run += 1) {
    const weights = {}
    for (const key of PREVIEW_FEATURE_KEYS) {
      const delta = (random() * 2 - 1) * range
      weights[key] = base[key] * (1 + delta)
    }
    const ranking = rankRecords(matrix, weights)
    const runTop5 = new Set(topN(ranking, 5))
    const runTop10 = new Set(topN(ranking, 10))
    top5RetentionSum += topNOverlap(baseTop5, [...runTop5])
    top10RetentionSum += topNOverlap(baseTop10, [...runTop10])
    for (const id of baseTop5) if (!runTop5.has(id)) membershipFlips[id] += 1
    for (const id of baseTop10) if (!runTop10.has(id)) membershipFlips[id] += 1
  }

  const top5Stability = Math.round((top5RetentionSum / auditRuns) * 1000) / 1000
  const top10Stability = Math.round((top10RetentionSum / auditRuns) * 1000) / 1000
  const unstableCandidates = Object.entries(membershipFlips)
    .filter(([, flips]) => flips / auditRuns > (options.unstableThreshold ?? 0.2))
    .map(([recordId, flips]) => ({ recordId, flipRate: Math.round((flips / auditRuns) * 1000) / 1000 }))
    .sort((a, b) => b.flipRate - a.flipRate)

  // Leave-one-feature-out to find which features most affect the Top-5.
  const sensitiveDescriptors = PREVIEW_FEATURE_KEYS
    .map(key => {
      const ranking = rankRecords(matrix, base, { skipFeatures: [key] })
      return { feature: key, top5Overlap: topNOverlap(baseTop5, topN(ranking, 5)) }
    })
    .filter(row => row.top5Overlap < 1)
    .sort((a, b) => a.top5Overlap - b.top5Overlap)
    .map(row => row.feature)

  return {
    id: "weight_perturbation",
    auditRuns,
    perturbationRange: range,
    seed,
    top5Stability,
    top10Stability,
    unstableCandidates,
    sensitiveDescriptors,
    notFinalRecommendation: true,
  }
}

// Audit 2: redundancy penalty on vs off.
export function runRedundancyPenaltyToggleAudit(records = [], options = {}) {
  const matrix = buildPreviewFeatureMatrix(records)
  const base = defaultPreviewWeights()
  const baseTop10 = topN(rankRecords(matrix, base), 10)

  const redundancy = buildDescriptorRedundancySummary(records)
  const penalty = buildRedundancyWeightPenalty(PREVIEW_FEATURE_KEYS, redundancy.redundantPairs, options.penalty ?? 0.7)
  const penalizedWeights = {}
  for (const key of PREVIEW_FEATURE_KEYS) penalizedWeights[key] = base[key] * (penalty.weights[key] ?? 1)
  const penalizedTop10 = topN(rankRecords(matrix, penalizedWeights), 10)

  const overlap = topNOverlap(baseTop10, penalizedTop10)
  return {
    id: "redundancy_penalty_toggle",
    penalizedDescriptors: penalty.penalizedDescriptors,
    topNOverlap: overlap,
    changed: overlap < 1,
    notFinalRecommendation: true,
  }
}

// Audit 3: mechanism proxies on vs off (descriptors only).
export function runMechanismProxyToggleAudit(records = [], options = {}) {
  const matrix = buildPreviewFeatureMatrix(records)
  const base = defaultPreviewWeights()
  const baseTop10 = topN(rankRecords(matrix, base), 10)
  const withoutProxies = topN(rankRecords(matrix, base, { includeProxies: false }), 10)
  const overlap = topNOverlap(baseTop10, withoutProxies)
  return {
    id: "mechanism_proxy_toggle",
    topNOverlap: overlap,
    overRelianceRisk: overlap < (options.overRelianceThreshold ?? 0.5),
    notFinalRecommendation: true,
  }
}

// Audit 4: metadata gate sensitivity (partial+ only vs include preview-only).
export function runMetadataGateSensitivityAudit(records = [], options = {}) {
  const matrix = buildPreviewFeatureMatrix(records)
  const base = defaultPreviewWeights()
  const allTop10 = topN(rankRecords(matrix, base), 10)
  const gatedMatrix = matrix.filter(row => row.metadataLevel === "partial_metadata" || row.metadataLevel === "verified_metadata")
  const gatedTop10 = topN(rankRecords(gatedMatrix, base), 10)
  const overlap = topNOverlap(gatedTop10, allTop10)
  return {
    id: "metadata_gate_sensitivity",
    gatedRecordCount: gatedMatrix.length,
    topNOverlap: overlap,
    notFinalRecommendation: true,
  }
}

export function buildSensitivityAuditSummary(records = [], options = {}) {
  const weightAudit = runWeightPerturbationAudit(records, options)
  const redundancyAudit = runRedundancyPenaltyToggleAudit(records, options)
  const mechanismAudit = runMechanismProxyToggleAudit(records, options)
  const metadataAudit = runMetadataGateSensitivityAudit(records, options)

  return {
    mode: "audit_only",
    notFinalRecommendation: true,
    recordCount: Array.isArray(records) ? records.length : 0,
    auditRuns: weightAudit.auditRuns,
    top5Stability: weightAudit.top5Stability,
    top10Stability: weightAudit.top10Stability,
    unstableCandidateCount: weightAudit.unstableCandidates.length,
    unstableCandidates: weightAudit.unstableCandidates,
    sensitiveDescriptors: weightAudit.sensitiveDescriptors,
    audits: [weightAudit, redundancyAudit, mechanismAudit, metadataAudit],
    boundary: "Sensitivity audit only. Reports ranking stability, not predictive precision. Not validation proof or final recommendation.",
    boundaryZh: "仅敏感性审计。报告排序稳定性，不是精度。不是验证证据，也不是最终推荐。",
  }
}
