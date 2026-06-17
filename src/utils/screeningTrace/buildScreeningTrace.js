// @ts-nocheck
// V2.0-M Screening trace builder. Turns the CRITIC scoring model + the V2.0-M verified
// metadata summary into an explainable screening trace: ordered steps, a candidate
// funnel, per-candidate ranking traces, data gaps, and next actions. It does NOT change
// any score, does NOT run full database scoring, and never claims a final recommendation.
// "Verified screening" is only true when verifiedMetadataCount >= 1.
import { explainCandidateRanking } from "./explainCandidateRanking.js"
import { buildPriorityImpactSummary, resolvePerformancePriorityMode } from "../performancePriority.js"

export const FIELD_PROVENANCE_KEYS = [
  "displayName",
  "surfaceArea",
  "poreSizeA",
  "pldA",
  "lcdA",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "metalNode",
  "linker",
  "topology",
]

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function ratio(c) { const v = c.descriptorCompleteness; return typeof v === "number" ? v : num(v?.ratio) }
function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key) }
function isPresent(value) {
  if (value === null || value === undefined || value === "") return false
  const normalized = String(value).trim().toLowerCase()
  return !["pending", "unknown", "missing", "n/a", "na", "null", "undefined"].includes(normalized)
}
function fieldStatus(source, fallbackValue) {
  if (!source) return isPresent(fallbackValue) ? "pending" : "missing"
  if (source.status) return source.status
  if (source.fieldStatus) return source.fieldStatus
  if (source.sourceType === "missing" || source.sourceType === "pending") return source.sourceType
  if (source.curationStatus) return source.curationStatus
  return isPresent(fallbackValue) ? "pending" : "missing"
}
function fieldBlocksVerified(source, fallbackValue) {
  const status = fieldStatus(source, fallbackValue)
  return Boolean(source?.blocksVerifiedMetadata || source?.hasAmbiguity || ["pending", "ambiguous", "missing", "unknown"].includes(status))
}
function hasAmbiguity(candidate) {
  const verification = candidate.verification || {}
  if (candidate.quarantined || verification.quarantined) return true
  if (Array.isArray(candidate.ambiguityWarnings) && candidate.ambiguityWarnings.length) return true
  if (Array.isArray(verification.ambiguityWarnings) && verification.ambiguityWarnings.length) return true
  return Object.values(candidate.fieldSources || {}).some(source => source?.hasAmbiguity || fieldStatus(source) === "ambiguous")
}
function countByCandidate(rows, predicate) {
  return rows.filter(predicate).length
}

export function buildScreeningTrace(options = {}) {
  const model = options.model || {}
  const allCandidates = Array.isArray(model.candidates) ? model.candidates : (options.candidates || [])
  const verification = options.verification || {}
  const scenarioLabel = options.scenarioLabel || "general"
  const priorityMode = resolvePerformancePriorityMode(options.performancePriorityMode || model.performancePriorityMode || model.metadata?.performancePriorityMode || "balanced")
  const priorityImpactSummary = buildPriorityImpactSummary(priorityMode.id)
  const ranked = allCandidates.filter(c => Number(c.G) !== 0 && !hasAmbiguity(c))
  const excluded = allCandidates.filter(c => Number(c.G) === 0)
  const totalCandidates = num(options.totalCandidates, allCandidates.length)

  const completeOver70 = allCandidates.filter(c => ratio(c) >= 0.7).length
  const descriptorAvailable = allCandidates.filter(c => ratio(c) > 0).length
  const evidenceAvailable = allCandidates.filter(c => c.evidenceLevel && c.evidenceLevel !== "D").length
  const sourceConfirmedCount = hasOwn(verification, "sourceConfirmedCount") ? num(verification.sourceConfirmedCount) : countByCandidate(allCandidates, c => c.sourceConfirmed || c.verification?.sourceConfirmed || c.sourceStatus === "confirmed")
  const citationReadyCount = hasOwn(verification, "citationReadyCount") ? num(verification.citationReadyCount) : countByCandidate(allCandidates, c => c.citationReady || c.citationStatus === "ready" || c.verification?.citationStatus === "ready")
  const verifiedMetadataCount = hasOwn(verification, "verifiedMetadataCount") ? num(verification.verifiedMetadataCount) : countByCandidate(allCandidates, c => c.verifiedMetadata || c.verification?.verifiedMetadata)
  const quarantinedCount = hasOwn(verification, "quarantinedCount") ? num(verification.quarantinedCount) : countByCandidate(allCandidates, hasAmbiguity)
  const isVerifiedScreening = verifiedMetadataCount >= 1

  const weightRows = Array.isArray(model.weights)
    ? model.weights
    : Array.isArray(model.indicatorDiagnostics)
      ? model.indicatorDiagnostics
      : Object.entries(model.weights || {}).map(([key, weight]) => ({ key, weight }))
  const topWeights = weightRows.slice().sort((a, b) => num(b.weight) - num(a.weight)).slice(0, 3)

  const step = (stepId, title, titleZh, status, inputCount, outputCount, removedCount, keyMessage, keyMessageZh, details, detailsZh, linkedPanelId, blockers = [], extra = {}) => ({
    stepId, title, titleZh, status, inputCount: num(inputCount), outputCount: num(outputCount), removedCount: num(removedCount),
    keyMessage, keyMessageZh, details, detailsZh, linkedPanelId, blockers, ...extra,
  })

  const steps = [
    step("candidate_pool", "Candidate Pool Loaded", "候选池已加载", "completed", totalCandidates, totalCandidates, 0,
      `${totalCandidates} candidates loaded (database preview, not verified screening).`, `已加载 ${totalCandidates} 个候选（数据库预览，不是经核验筛选）。`,
      "Source: Open MOF Seed / curated sample.", "来源：Open MOF Seed / 人工样本。", "screening-funnel-panel"),
    step("descriptor_availability", "Descriptor Availability Check", "描述符可用性检查", descriptorAvailable > 0 ? "completed" : "warning", totalCandidates, descriptorAvailable, totalCandidates - descriptorAvailable,
      `${completeOver70} candidates have descriptor completeness > 70%.`, `${completeOver70} 个候选描述符完整度 > 70%。`,
      "Records missing core descriptors are down-weighted.", "缺少核心描述符的记录会被降权。", "screening-data-gap"),
    step("scenario_filter", "Scenario Filter Applied", "场景筛选", "completed", descriptorAvailable, ranked.length, Math.max(0, descriptorAvailable - ranked.length),
      `Scenario "${scenarioLabel}" applied; ${excluded.length} candidates hard-screened and ${quarantinedCount} quarantined by ambiguity.`, `已应用场景“${scenarioLabel}”；${excluded.length} 个候选被硬筛排除，${quarantinedCount} 个因歧义隔离。`,
      "Hard-screen constraints remove candidates that fail required conditions.", "硬筛约束会移除不满足必需条件的候选。", "screening-funnel-panel"),
    step("normalization", "Normalization", "标准化", "completed", ranked.length, ranked.length, 0,
      "Benefit/cost indicators normalized to [0,1].", "收益型/成本型指标归一化到 [0,1]。",
      "Benefit-type higher-is-better; cost-type lower-is-better.", "收益型越大越好；成本型越小越好。", "candidate-decision-dashboard"),
    step("performance_priority_applied", "Performance Priority Applied", "性能优先级已应用", "completed", ranked.length, ranked.length, 0,
      `Priority mode: ${priorityMode.label}.`, `优先级模式：${priorityMode.labelZh}。`,
      priorityImpactSummary.rankingImpact, priorityImpactSummary.rankingImpactZh, "candidate-decision-dashboard", [], {
        priorityMode: priorityMode.id,
        affectedDescriptors: priorityImpactSummary.affectedDescriptors,
        boostedWeights: priorityImpactSummary.boostedWeights,
        penalizedFactors: priorityImpactSummary.penalizedFactors,
        rankingImpact: priorityImpactSummary.rankingImpact,
        rankingImpactZh: priorityImpactSummary.rankingImpactZh,
      }),
    step("critic_weighting", "CRITIC Weighting", "CRITIC 权重", topWeights.length ? "completed" : "warning", ranked.length, ranked.length, 0,
      topWeights.length ? `Top weights: ${topWeights.map(w => w.label || w.key).join(", ")}.` : "Weights generated.", topWeights.length ? `主要权重：${topWeights.map(w => w.zhLabel || w.label || w.key).join("、")}。` : "已生成权重。",
      "Weight expresses ranking influence in this candidate set, not chemical causality.", "权重表示在该候选集中的排序影响，而非化学因果。", "candidate-ranking-explanation"),
    step("evidence_adjustment", "Evidence Adjustment", "证据修正", "completed", ranked.length, ranked.length, 0,
      `Source confirmed: ${sourceConfirmedCount} · citation ready: ${citationReadyCount} · verified metadata: ${verifiedMetadataCount} · quarantined: ${quarantinedCount}.`, `来源已确认：${sourceConfirmedCount} · 引用可用：${citationReadyCount} · 已核验元数据：${verifiedMetadataCount} · 隔离：${quarantinedCount}。`,
      "Evidence level modulates confidence, not the raw score.", "证据等级调节置信度，而非原始得分。", "evidence-data-gaps"),
    step("risk_gap_check", "Risk & Gap Check", "风险与缺口检查", "warning", ranked.length, ranked.length, 0,
      "Main risks: metadata ambiguity, missing DOI, license pending, low descriptor completeness, weak evidence.", "主要风险：元数据歧义、缺少 DOI、license 待补、描述符完整度低、证据偏弱。",
      "Risks reduce ranking confidence; they do not silently drop candidates.", "风险会降低排序置信度，但不会静默剔除候选。", "screening-data-gap",
      ["metadata ambiguity", "missing DOI", "license pending"]),
    step("final_ranking", "Final Ranking", "排名结果", "completed", ranked.length, ranked.length, 0,
      `${ranked.length} ranked candidates; top: ${ranked.slice(0, 3).map(c => c.displayName || c.name || c.id).join(", ")}.`, `${ranked.length} 个排名候选；前列：${ranked.slice(0, 3).map(c => c.displayName || c.name || c.id).join("、")}。`,
      isVerifiedScreening ? "Verified metadata candidates exist, but this is still not a final recommendation." : "This is a database preview ranking, not verified screening and not a final recommendation.", isVerifiedScreening ? "已有经核验元数据候选，但仍不是最终推荐。" : "这是数据库预览排名，不是经核验筛选，也不是最终推荐。", "candidate-decision-dashboard"),
    step("next_action", "Next Action", "下一步建议", verifiedMetadataCount > 0 ? "completed" : "warning", ranked.length, ranked.length, 0,
      verifiedMetadataCount > 0 ? "Validate verified candidates for the target scenario." : "Verify at least one candidate's DOI, license, source URL, and record mapping.", verifiedMetadataCount > 0 ? "对经核验候选做场景验证。" : "先核验至少一个候选的 DOI、license、来源链接与记录映射。",
      "Do not call this verified screening until verifiedMetadataCount >= 1.", "在 verifiedMetadataCount >= 1 之前不要称其为经核验筛选。", "screening-next-action"),
  ]

  const funnel = [
    funnelStage("raw", "Raw candidates", "原始候选", totalCandidates, descriptorAvailable, "missing descriptors", "hard"),
    funnelStage("descriptor", "Descriptor available", "描述符可用", descriptorAvailable, completeOver70, "completeness <= 70%", "soft"),
    funnelStage("completeness", "Completeness > 70%", "完整度 > 70%", completeOver70, ranked.length, "scenario hard-screen", "hard"),
    funnelStage("ranked", "Ranked candidates", "排名候选", ranked.length, sourceConfirmedCount, "source not confirmed", "annotation_only"),
    funnelStage("source_confirmed", "Source confirmed", "来源已确认", sourceConfirmedCount, verifiedMetadataCount, "license/DOI/mapping pending", "annotation_only"),
  ]

  const candidateTraces = ranked.slice(0, Math.min(100, ranked.length)).map(c => explainCandidateRanking(c, model))

  const dataGaps = buildDataGaps(allCandidates, model)

  const nextActions = buildNextActions({ verifiedMetadataCount, sourceConfirmedCount })

  return {
    runId: `screening-trace-${(options.now || "2026-06").toString().replace(/\D/g, "").slice(0, 14) || "202606"}`,
    mode: "database_preview",
    isVerifiedScreening,
    totalCandidates,
    finalCandidates: ranked.length,
    sourceConfirmedCount,
    citationReadyCount,
    verifiedMetadataCount,
    descriptorCompleteCount: completeOver70,
    descriptorAvailableCount: descriptorAvailable,
    evidenceAvailableCount: evidenceAvailable,
    quarantinedCount,
    dataGapCount: dataGaps.candidateGaps.length,
    notFinalRecommendation: true,
    performancePriorityMode: priorityMode.id,
    priorityImpactSummary,
    steps,
    funnel,
    candidateTraces,
    dataGaps,
    nextActions,
  }
}

function funnelStage(stageId, stageName, stageNameZh, inputCount, outputCount, removalReason, filterType) {
  return {
    stageId, stageName, stageNameZh,
    inputCount: num(inputCount), outputCount: num(outputCount),
    removedCount: Math.max(0, num(inputCount) - num(outputCount)),
    removalReasons: [removalReason],
    filterType,
  }
}

function buildDataGaps(ranked, model) {
  const fieldCounts = {}
  const candidateGaps = ranked.map(c => {
    const inputs = c.scoreInputs || {}
    const missing = Object.entries(inputs).filter(([, v]) => v?.missing).map(([k]) => k)
    for (const field of missing) fieldCounts[field] = (fieldCounts[field] || 0) + 1
    const fieldSourceGaps = FIELD_PROVENANCE_KEYS
      .filter(field => fieldBlocksVerified(c.fieldSources?.[field], c[field]))
      .map(field => {
        const source = c.fieldSources?.[field]
        const status = fieldStatus(source, c[field])
        fieldCounts[field] = (fieldCounts[field] || 0) + 1
        return { field, status, reason: source?.missingReason || source?.notes || status }
      })
    return {
      candidateId: c.id || c.candidateId,
      displayName: c.displayName || c.name || c.id,
      missingDescriptors: missing,
      fieldSourceGaps,
      blockers: Array.isArray(c.dataGaps) ? c.dataGaps : [],
    }
  })
  const byField = Object.entries(fieldCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count)
  return {
    byField,
    priorityRepairList: byField.slice(0, 3).map(f => f.field),
    candidateGaps,
    notFinalRecommendation: true,
  }
}

export function buildNextActions({ verifiedMetadataCount = 0, sourceConfirmedCount = 0 } = {}) {
  if (verifiedMetadataCount >= 1) {
    return [{
      id: "validate_verified", tone: "info",
      en: "Verified metadata candidates are available, but final recommendation still requires scenario-specific validation.",
      zh: "已有经核验元数据候选，但最终推荐仍需针对具体场景的验证。",
    }]
  }
  if (sourceConfirmedCount > 0) {
    return [{
      id: "source_confirmed_only", tone: "warn",
      en: "Some candidates have source-confirmed material-level citations, but they are not verified metadata candidates yet.",
      zh: "部分候选已有来源确认的材料层级引用，但仍不是已核验元数据候选。",
    }]
  }
  return [{
    id: "database_preview", tone: "warn",
    en: "This is a database preview, not verified screening. Next step: verify at least one candidate's DOI, license, source URL, and record mapping.",
    zh: "这是数据库预览，不是经核验筛选。下一步：核验至少一个候选的 DOI、license、来源链接与记录映射。",
  }]
}
