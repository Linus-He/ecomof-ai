// @ts-nocheck
// V2.0-H Feature Ablation Audit.
//
// Inspired by the multi-stage feature selection idea in Han et al. 2024 (method
// analogy only, no model training). It removes / penalizes groups of features and
// measures how much the preview Top-N changes, to judge whether the ordering over-
// relies on a feature class. It does NOT delete any source descriptor field, does
// NOT modify OACS/DMRS formulas, does NOT claim any variant is "truly best", and is
// never a final recommendation.
import {
  PREVIEW_FEATURE_KEYS,
  buildPreviewFeatureMatrix,
  defaultPreviewWeights,
  rankRecords,
  topNOverlap,
} from "./previewRanking.js"
import { buildDescriptorRedundancySummary } from "./descriptorRedundancyGate.js"

function topN(list, n) {
  return list.slice(0, n)
}

export function buildFeatureAblationAudit(records = [], options = {}) {
  const n = options.topN || 10
  const matrix = buildPreviewFeatureMatrix(records)
  const base = defaultPreviewWeights()
  const baseRanking = rankRecords(matrix, base)
  const baseTopN = topN(baseRanking, n)

  const redundancy = buildDescriptorRedundancySummary(records)
  // The second member of each redundant pair is the duplicate to drop in the variant.
  const redundantDropouts = redundancy.redundantPairs
    .map(pair => pair.descriptorB)
    .filter(key => PREVIEW_FEATURE_KEYS.includes(key))

  const variants = [
    {
      id: "all_descriptors",
      label: "All descriptors baseline",
      labelZh: "全描述符基线",
      topN: baseTopN,
      topNOverlapWithBaseline: 1,
      removedOrPenalized: [],
      boundary: "Audit baseline only.",
      boundaryZh: "仅作审计基线。",
    },
    {
      id: "without_redundant_descriptors",
      label: "Without redundant descriptors",
      labelZh: "去除冗余描述符",
      ...ablate(matrix, base, baseTopN, { skipFeatures: redundantDropouts }, n),
      removedOrPenalized: redundantDropouts,
    },
    {
      id: "without_mechanism_proxies",
      label: "Without mechanism proxies",
      labelZh: "去除机制代理",
      ...ablate(matrix, base, baseTopN, { includeProxies: false }, n),
      removedOrPenalized: ["co2ActivationProxy", "poreTransportProxy", "metalSiteSynergyProxy", "hydrothermalStabilityProxy", "competitionRiskProxy"],
    },
    {
      id: "metadata_gate_only",
      label: "Metadata gate only",
      labelZh: "仅 metadata 门控",
      ...ablateMetadataOnly(matrix, baseTopN, n),
      removedOrPenalized: PREVIEW_FEATURE_KEYS,
    },
  ]

  const mostAffectedCandidates = baseTopN.filter(id =>
    variants.some(v => v.id !== "all_descriptors" && !v.topN.includes(id)),
  )

  return {
    mode: "ablation_audit",
    notFinalRecommendation: true,
    topN: n,
    variants,
    mostAffectedCandidates,
    boundary: "Ablation audit only. No descriptor field is deleted, no OACS/DMRS change, and no variant is claimed to be truly best.",
    boundaryZh: "仅消融审计。不删除任何描述符字段、不修改 OACS/DMRS，也不声称某组真正最好。",
  }
}

function ablate(matrix, base, baseTopN, options, n) {
  const ranking = rankRecords(matrix, base, options)
  const variantTopN = topN(ranking, n)
  return {
    topN: variantTopN,
    topNOverlapWithBaseline: topNOverlap(baseTopN, variantTopN),
    boundary: "Audit variant only.",
    boundaryZh: "仅作审计变体。",
  }
}

// "Metadata gate only" ranks purely by metadata level (verified > partial > preview > blocked).
function ablateMetadataOnly(matrix, baseTopN, n) {
  const order = { verified_metadata: 0, partial_metadata: 1, preview_only: 2, blocked: 3 }
  const ranking = [...matrix]
    .sort((a, b) => (order[a.metadataLevel] ?? 9) - (order[b.metadataLevel] ?? 9) || String(a.recordId).localeCompare(String(b.recordId)))
    .map(row => row.recordId)
  const variantTopN = topN(ranking, n)
  return {
    topN: variantTopN,
    topNOverlapWithBaseline: topNOverlap(baseTopN, variantTopN),
    boundary: "Ranks by metadata level only.",
    boundaryZh: "仅按 metadata 等级排序。",
  }
}
