import { createHash } from "node:crypto"

const REQUIRED_COMPARISON_FIELDS = [
  "cellType",
  "electrolyte",
  "potentialOrCurrent",
  "duration",
  "catalystLoading",
  "productQuantification",
]

export function normalizeDoi(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase()
}

export function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export function verificationLevelForEvidence(location = "") {
  const normalized = String(location).toLowerCase()
  if (/figure|fig\.|table|supporting|supplement|page|section/.test(normalized)) return "L4-claim-located"
  if (/full text/.test(normalized)) return "L3-fulltext-reviewed"
  if (/abstract/.test(normalized)) return "L2-abstract-only"
  return "L1-source-identified"
}

export function buildConditionSet(record) {
  const direct = record.conditions || {}
  const metricConditions = (record.performanceMetrics || []).map(metric => metric.condition || {})
  const first = key => direct[key] ?? metricConditions.find(condition => condition[key] != null)?.[key] ?? null
  const condition = {
    id: `condition-${record.id}`,
    reactionRecordId: record.id.replace("catrxn-v1-", "catrxn-v2-"),
    cellType: first("cellType"),
    electrolyte: first("electrolyte"),
    potentialVsRheV: direct.potentialVsRheVApprox != null && direct.potentialVsRheV == null ? null : first("potentialVsRheV"),
    potentialVsRheVApprox: first("potentialVsRheVApprox"),
    currentMode: first("currentMode"),
    appliedCurrentDensity: first("appliedCurrentDensity"),
    appliedCurrentDensityUnit: first("appliedCurrentDensityUnit"),
    durationH: first("durationH"),
    catalystLoading: direct.catalystLoading ?? direct.catalystLoadingMgCm2 ?? null,
    catalystLoadingUnit: direct.catalystLoadingUnit ?? (direct.catalystLoadingMgCm2 != null ? "mg cm-2" : null),
    gasFlowRate: direct.gasFlowRate ?? null,
    gasFlowRateUnit: direct.gasFlowRateUnit ?? null,
    productQuantification: direct.productQuantificationProtocol ?? direct.quantificationMethod ?? null,
    productQuantificationSourceLocation: direct.productQuantificationSourceLocation ?? null,
    legacyMissingFieldNotes: direct.missingFields || [],
  }
  condition.sourceMissingFields = comparisonCompleteness(condition).missing
  return condition
}

export function comparisonCompleteness(condition) {
  const values = {
    cellType: condition.cellType,
    electrolyte: condition.electrolyte,
    potentialOrCurrent: condition.potentialVsRheV ?? condition.potentialVsRheVApprox ?? condition.appliedCurrentDensity,
    duration: condition.durationH,
    catalystLoading: condition.catalystLoading,
    productQuantification: condition.productQuantification,
  }
  const missing = REQUIRED_COMPARISON_FIELDS.filter(field => values[field] == null || values[field] === "")
  return { required: REQUIRED_COMPARISON_FIELDS, missing, ratio: (REQUIRED_COMPARISON_FIELDS.length - missing.length) / REQUIRED_COMPARISON_FIELDS.length }
}

export function buildEligibilityDecision({ sourceDocument, conditionSet, claims, catalystState }) {
  const completeness = comparisonCompleteness(conditionSet)
  const locatedClaims = claims.filter(claim => claim.value != null && claim.verificationLevel === "L4-claim-located")
  const numericClaims = claims.filter(claim => claim.value != null)
  const activeStatus = !["retracted", "withdrawn"].includes(sourceDocument.scholarStatus)
  const browseEligible = sourceDocument.metadataVerification === "matched" && activeStatus
  const compareEligible = browseEligible && completeness.missing.length === 0 && numericClaims.length > 0 && locatedClaims.length === numericClaims.length
  const trainingEligible = compareEligible && Boolean(catalystState.identityLink?.canonicalId) && sourceDocument.license?.trainingUseAllowed === true
  const recommendationEligible = trainingEligible && catalystState.activePhaseStatus === "experimentally-resolved"
  const blockers = []
  if (!browseEligible) blockers.push("article-identity-or-status-not-cleared")
  if (completeness.missing.length) blockers.push(...completeness.missing.map(field => `missing-condition:${field}`))
  if (locatedClaims.length !== numericClaims.length) blockers.push("numeric-claims-lack-precise-source-location")
  if (!catalystState.identityLink?.canonicalId) blockers.push("structure-identity-unresolved")
  if (sourceDocument.license?.trainingUseAllowed !== true) blockers.push("training-license-not-cleared")
  if (catalystState.activePhaseStatus !== "experimentally-resolved") blockers.push("active-phase-not-experimentally-resolved")
  return {
    id: `eligibility-${conditionSet.reactionRecordId}`,
    reactionRecordId: conditionSet.reactionRecordId,
    browseEligible,
    compareEligible,
    trainingEligible,
    recommendationEligible,
    conditionCompleteness: completeness,
    blockers: [...new Set(blockers)],
    decidedBy: "catalysis-v2-deterministic-gate",
  }
}

export function buildVerificationTasks({ sourceDocument, conditionSet, claims, catalystState, eligibility }) {
  const tasks = []
  const push = (type, priority, targetId, titleZh, titleEn, reason) => tasks.push({
    id: `task-${sourceDocument.id}-${type}-${tasks.length + 1}`,
    sourceDocumentId: sourceDocument.id,
    reactionRecordId: conditionSet.reactionRecordId,
    targetId,
    type,
    priority,
    status: "open",
    titleZh,
    titleEn,
    reason,
  })
  const impreciseClaims = claims.filter(claim => claim.value != null && claim.verificationLevel !== "L4-claim-located")
  if (impreciseClaims.length) push("claim-location-backfill", "P0", impreciseClaims.map(claim => claim.id), "补齐数值的图表或补充材料位置", "Locate numeric claims in figures, tables, or SI", `${impreciseClaims.length} numeric claims remain below L4.`)
  for (const field of eligibility.conditionCompleteness.missing) {
    push("condition-backfill", "P0", conditionSet.id, `补齐比较条件：${field}`, `Backfill comparison condition: ${field}`, `Required comparison field ${field} is missing.`)
  }
  if (!catalystState.identityLink?.canonicalId) push("identity-resolution", "P1", catalystState.id, "核验精确结构身份", "Resolve exact structure identity", "No exact CSD Refcode, CCDC identifier, or provenance-matched canonical ID is available.")
  if (catalystState.activePhaseStatus !== "experimentally-resolved") push("active-phase-review", "P1", catalystState.id, "核验真实催化活性相", "Review the catalytically active phase", "Precursor, derived, operando, and post-reaction states are not yet experimentally resolved into one active-phase decision.")
  if (sourceDocument.license?.trainingUseAllowed !== true) push("license-review", "P1", sourceDocument.id, "核验模型训练使用许可", "Review machine-learning reuse license", "Metadata access does not establish permission to reuse full-text-derived claims for model training.")
  return tasks
}
