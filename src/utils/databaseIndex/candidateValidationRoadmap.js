// @ts-nocheck
// V2.0-H Candidate Validation Roadmap.
//
// For top candidates, produces the next verification directions (metadata, descriptor,
// and mechanism follow-ups) rather than only a score. It gives validation DIRECTIONS
// only: it never claims an experiment will succeed, never provides concrete or
// hazardous experimental recipes/conditions, and is never a final recommendation.
import { normalizeMetadataVerification, metadataReasonLabel } from "./metadataVerification.js"
import { buildMechanismProxies } from "../organicAcid/mechanismProxyMapping.js"

const MECHANISM_ACTION_COPY = {
  co2ActivationProxy: { en: "Review CO2 activation evidence", zh: "复核 CO₂ 活化证据" },
  formatePathwayProxy: { en: "Check formate pathway plausibility", zh: "检查甲酸路径可行性" },
  metalSiteSynergyProxy: { en: "Assess metal-site synergy assumption", zh: "评估金属位点协同假设" },
  competitionRiskProxy: { en: "Assess competing CO/methanol pathway risk", zh: "评估竞争 CO/甲醇路径风险" },
  hydrothermalStabilityProxy: { en: "Confirm hydrothermal stability evidence", zh: "确认水热稳定性证据" },
  poreTransportProxy: { en: "Validate pore-transport assumption", zh: "验证孔道传质假设" },
}

function priorityFromTier(tier, mechanismConfidence) {
  if (tier === "near_verified" || tier === "verified_metadata") return "high"
  if (tier === "partial_metadata" || mechanismConfidence === "high") return "medium"
  return "low"
}

export function buildCandidateValidationRoadmap(record = {}) {
  const verification = normalizeMetadataVerification(record)
  const mechanism = buildMechanismProxies(record)

  const metadataActions = []
  if (verification.doiStatus !== "verified" && verification.doiStatus !== "not_applicable") metadataActions.push({ en: "Confirm DOI / source URL", zh: "确认 DOI / 来源链接" })
  if (verification.licenseStatus !== "verified") metadataActions.push({ en: "Confirm license", zh: "确认 license" })
  if (verification.descriptorProvenanceStatus !== "complete") metadataActions.push({ en: "Verify descriptor provenance", zh: "核验描述符溯源" })

  const descriptors = record.descriptors || {}
  const descriptorActions = []
  if (!Number.isFinite(Number(descriptors.stabilityProxy)) && !Number.isFinite(Number(record.waterStability))) descriptorActions.push({ en: "Check water/thermal stability descriptor", zh: "核查水热/热稳定性描述符" })
  descriptorActions.push({ en: "Validate pore-size source", zh: "核验孔径来源" })
  descriptorActions.push({ en: "Confirm open-metal-site proxy", zh: "确认开放金属位点代理" })

  const mechanismActions = []
  for (const key of mechanism.proxyKeys) {
    const status = mechanism.evidence?.[key]?.evidenceStatus
    if (status === "weak_proxy" || status === "insufficient_evidence" || status === "descriptor_inferred") {
      const copy = MECHANISM_ACTION_COPY[key]
      if (copy) mechanismActions.push(copy)
    }
  }

  // Generic validation directions only — never concrete or hazardous recipes.
  const suggestedValidation = [{ en: "Literature review", zh: "文献复核" }]
  if (verification.verificationTier === "near_verified") suggestedValidation.push({ en: "DFT plausibility check", zh: "DFT 可行性核查" })
  if (mechanism.proxies.co2ActivationProxy !== null && mechanism.proxies.evidenceConfidenceProxy >= 0.5) {
    suggestedValidation.push({ en: "Small-scale exploratory experiment (direction only)", zh: "小规模探索性实验（仅方向）" })
  }

  const mechanismConfidence = mechanism.proxies.evidenceConfidenceProxy >= 0.6 ? "high" : mechanism.proxies.evidenceConfidenceProxy >= 0.35 ? "medium" : "low"

  return {
    recordId: record.recordId || record.frameworkId || record.id || "candidate",
    displayName: record.displayName || record.recordId || "Candidate",
    validationPriority: priorityFromTier(verification.verificationTier, mechanismConfidence),
    verificationTier: verification.verificationTier,
    metadataActions,
    descriptorActions,
    mechanismActions: mechanismActions.slice(0, 4),
    suggestedValidation,
    blockingReasons: verification.blockingReasons.map(reason => ({ key: reason, en: metadataReasonLabel(reason, "en"), zh: metadataReasonLabel(reason, "zh") })),
    notFinalRecommendation: true,
    boundary: "Validation directions only; not a guarantee of success, not a recipe, and not a final recommendation.",
    boundaryZh: "仅验证方向；不保证成功、不提供实验配方，也不是最终推荐。",
  }
}

const TIER_RANK = { verified_metadata: 0, near_verified: 1, partial_metadata: 2, preview_only: 3, blocked: 4 }

export function buildValidationRoadmapForRecords(records = [], options = {}) {
  const rows = Array.isArray(records) ? records : []
  const limit = options.topN || Math.min(rows.length, 12)
  // Focus the roadmap on the strongest-tier candidates first (deterministic order).
  const ordered = [...rows].sort((a, b) =>
    (TIER_RANK[normalizeMetadataVerification(a).verificationTier] ?? 9) - (TIER_RANK[normalizeMetadataVerification(b).verificationTier] ?? 9) ||
    String(a.recordId || a.id || "").localeCompare(String(b.recordId || b.id || "")),
  )
  const roadmaps = ordered.slice(0, limit).map(buildCandidateValidationRoadmap)
  const priorityCounts = { high: 0, medium: 0, low: 0 }
  for (const roadmap of roadmaps) priorityCounts[roadmap.validationPriority] += 1
  return {
    mode: "validation_roadmap",
    notFinalRecommendation: true,
    candidateCount: roadmaps.length,
    priorityCounts,
    roadmaps,
    boundary: "Validation roadmap only; directions for manual follow-up, not a final recommendation.",
    boundaryZh: "仅验证路线；提供人工跟进方向，不是最终推荐。",
  }
}
