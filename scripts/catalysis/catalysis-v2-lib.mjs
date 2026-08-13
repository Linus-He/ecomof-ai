import { createHash } from "node:crypto"

const REQUIRED_COMPARISON_FIELDS = [
  "cellType",
  "electrolyte",
  "potentialOrCurrent",
  "duration",
  "catalystLoading",
  "productQuantification",
]

const COMPARISON_FIELDS_BY_SCOPE = {
  "reaction-performance": REQUIRED_COMPARISON_FIELDS,
  "electrochemical-polarization": [
    "cellType",
    "electrolyte",
    "potentialOrCurrent",
    "catalystLoading",
    "polarizationProtocol",
  ],
  "turnover-frequency": [
    "cellType",
    "electrolyte",
    "potentialOrCurrent",
    "duration",
    "activeSiteNormalization",
    "productQuantification",
  ],
}

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

export function hasExactCatalystIdentity(catalystState) {
  return Boolean(catalystState?.identityLink?.canonicalId || catalystState?.activeMaterialIdentity?.identifier)
}

export function verificationLevelForEvidence(location = "") {
  const normalized = String(location).toLowerCase()
  if (/figure|fig\.|table|supporting|supplement|page|section/.test(normalized)) return "L4-claim-located"
  if (/full text/.test(normalized)) return "L3-fulltext-reviewed"
  if (/abstract/.test(normalized)) return "L2-abstract-only"
  return "L1-source-identified"
}

export function buildConditionSet(record, options = {}) {
  const direct = record.conditions || {}
  const metricConditions = options.fallbackToMetricConditions === false
    ? []
    : (options.metrics || record.performanceMetrics || []).map(metric => metric.condition || {})
  const first = key => direct[key] ?? metricConditions.find(condition => condition[key] != null)?.[key] ?? null
  const condition = {
    id: options.id || `condition-${record.id}`,
    reactionRecordId: options.reactionRecordId || record.id.replace("catrxn-v1-", "catrxn-v2-"),
    experimentRunId: options.experimentRunId || null,
    comparisonScope: options.comparisonScope || "reaction-performance",
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
    catalystLoadingBasis: direct.catalystLoadingBasis ?? null,
    catalystLoadingStatus: direct.catalystLoadingStatus ?? null,
    catalystLoadingCalculation: direct.catalystLoadingCalculation ?? null,
    geometricElectrodeAreaCm2: direct.geometricElectrodeAreaCm2 ?? null,
    gasFlowRate: direct.gasFlowRate ?? null,
    gasFlowRateUnit: direct.gasFlowRateUnit ?? null,
    polarizationProtocol: direct.polarizationProtocol ?? null,
    activeSiteNormalization: direct.activeSiteNormalization ?? null,
    productQuantification: direct.productQuantificationProtocol ?? direct.quantificationMethod ?? null,
    productQuantificationSourceLocation: direct.productQuantificationSourceLocation ?? null,
    sourceLocations: direct.sourceLocations ?? [],
    legacyMissingFieldNotes: direct.missingFields || [],
  }
  condition.sourceMissingFields = comparisonCompleteness(condition).missing
  return condition
}

export function comparisonCompleteness(condition) {
  if (condition.comparisonScope === "material-characterization") {
    return {
      applicable: false,
      scope: condition.comparisonScope,
      required: [],
      missing: [],
      ratio: 1,
    }
  }
  const values = {
    cellType: condition.cellType,
    electrolyte: condition.electrolyte,
    potentialOrCurrent: condition.potentialVsRheV ?? condition.potentialVsRheVApprox ?? condition.appliedCurrentDensity,
    duration: condition.durationH,
    catalystLoading: condition.catalystLoading != null && condition.catalystLoadingBasis ? condition.catalystLoading : null,
    polarizationProtocol: condition.polarizationProtocol,
    activeSiteNormalization: condition.activeSiteNormalization,
    productQuantification: condition.productQuantification,
  }
  const required = COMPARISON_FIELDS_BY_SCOPE[condition.comparisonScope] || REQUIRED_COMPARISON_FIELDS
  const missing = required.filter(field => values[field] == null || values[field] === "")
  return {
    applicable: true,
    scope: condition.comparisonScope || "reaction-performance",
    required,
    missing,
    ratio: (required.length - missing.length) / required.length,
  }
}

export function buildEligibilityDecision({ sourceDocument, conditionSet, claims, catalystState, experimentRunId = null }) {
  const completeness = comparisonCompleteness(conditionSet)
  const comparisonApplicable = completeness.applicable !== false
  const locatedClaims = claims.filter(claim => claim.value != null && claim.verificationLevel === "L4-claim-located")
  const numericClaims = claims.filter(claim => claim.value != null)
  const activeStatus = !["retracted", "withdrawn"].includes(sourceDocument.scholarStatus)
  const browseEligible = sourceDocument.metadataVerification === "matched" && activeStatus
  const compareEligible = comparisonApplicable && browseEligible && completeness.missing.length === 0 && numericClaims.length > 0 && locatedClaims.length === numericClaims.length
  const trainingEligible = compareEligible && hasExactCatalystIdentity(catalystState) && sourceDocument.license?.trainingUseAllowed === true
  const recommendationEligible = trainingEligible && catalystState.activePhaseStatus === "experimentally-resolved"
  const blockers = []
  if (!browseEligible) blockers.push("article-identity-or-status-not-cleared")
  if (!comparisonApplicable) blockers.push(`comparison-not-applicable:${completeness.scope}`)
  if (comparisonApplicable && completeness.missing.length) blockers.push(...completeness.missing.map(field => `missing-condition:${field}`))
  if (locatedClaims.length !== numericClaims.length) blockers.push("numeric-claims-lack-precise-source-location")
  if (!hasExactCatalystIdentity(catalystState)) blockers.push("structure-identity-unresolved")
  if (sourceDocument.license?.trainingUseAllowed !== true) {
    blockers.push(sourceDocument.license?.reviewStatus?.startsWith("resolved") ? "training-license-restricted" : "training-license-not-cleared")
  }
  if (catalystState.activePhaseStatus !== "experimentally-resolved") blockers.push("active-phase-not-experimentally-resolved")
  return {
    id: experimentRunId ? `eligibility-${experimentRunId}` : `eligibility-${conditionSet.reactionRecordId}`,
    reactionRecordId: conditionSet.reactionRecordId,
    experimentRunId,
    browseEligible,
    comparisonApplicable,
    compareEligible,
    trainingEligible,
    recommendationEligible,
    conditionCompleteness: completeness,
    blockers: [...new Set(blockers)],
    decidedBy: "catalysis-v2-deterministic-gate",
  }
}

export function aggregateEligibilityDecision({ sourceDocument, reactionRecordId, catalystState, runDecisions }) {
  const activeStatus = !["retracted", "withdrawn"].includes(sourceDocument.scholarStatus)
  const browseEligible = sourceDocument.metadataVerification === "matched" && activeStatus
  const comparableRuns = runDecisions.filter(decision => decision.compareEligible)
  const trainableRuns = runDecisions.filter(decision => decision.trainingEligible)
  const recommendableRuns = runDecisions.filter(decision => decision.recommendationEligible)
  const applicableRunDecisions = runDecisions.filter(decision => decision.comparisonApplicable !== false)
  const bestCompleteness = [...applicableRunDecisions]
    .sort((left, right) => right.conditionCompleteness.ratio - left.conditionCompleteness.ratio)[0]?.conditionCompleteness
    || { required: REQUIRED_COMPARISON_FIELDS, missing: REQUIRED_COMPARISON_FIELDS, ratio: 0 }
  const blockers = []
  if (!browseEligible) blockers.push("article-identity-or-status-not-cleared")
  if (comparableRuns.length === 0) {
    blockers.push(...runDecisions.flatMap(decision => decision.blockers.filter(blocker => blocker.startsWith("missing-condition:") || blocker === "numeric-claims-lack-precise-source-location")))
  }
  if (!hasExactCatalystIdentity(catalystState)) blockers.push("structure-identity-unresolved")
  if (sourceDocument.license?.trainingUseAllowed !== true) {
    blockers.push(sourceDocument.license?.reviewStatus?.startsWith("resolved") ? "training-license-restricted" : "training-license-not-cleared")
  }
  if (catalystState.activePhaseStatus !== "experimentally-resolved") blockers.push("active-phase-not-experimentally-resolved")
  return {
    id: `eligibility-${reactionRecordId}`,
    reactionRecordId,
    browseEligible,
    compareEligible: comparableRuns.length > 0,
    trainingEligible: trainableRuns.length > 0,
    recommendationEligible: recommendableRuns.length > 0,
    conditionCompleteness: bestCompleteness,
    eligibleExperimentRunIds: comparableRuns.map(decision => decision.experimentRunId),
    blockers: [...new Set(blockers)],
    decidedBy: "catalysis-v2-experiment-run-aggregate-gate",
  }
}

export function buildVerificationTasks({ sourceDocument, conditionSets, experimentRuns, claims, catalystState, eligibility }) {
  const tasks = []
  const reactionRecordId = conditionSets[0]?.reactionRecordId
  const push = (type, priority, targetId, titleZh, titleEn, reason, experimentRunId = null) => tasks.push({
    id: `task-${sourceDocument.id}-${type}-${tasks.length + 1}`,
    sourceDocumentId: sourceDocument.id,
    reactionRecordId,
    experimentRunId,
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
  for (const conditionSet of conditionSets) {
    const run = experimentRuns.find(item => item.id === conditionSet.experimentRunId)
    const completeness = comparisonCompleteness(conditionSet)
    if (completeness.applicable === false) continue
    for (const field of completeness.missing) {
      const labelZh = run?.labelZh || "文献记录运行"
      const labelEn = run?.labelEn || "literature record run"
      push("condition-backfill", "P0", conditionSet.id, `补齐“${labelZh}”的比较条件：${field}`, `Backfill ${labelEn} condition: ${field}`, `Required comparison field ${field} is missing for experiment run ${run?.id || conditionSet.id}.`, run?.id || null)
    }
  }
  if (!hasExactCatalystIdentity(catalystState)) push("identity-resolution", "P1", catalystState.id, "核验精确结构身份", "Resolve exact structure identity", "No exact CSD Refcode, CCDC identifier, or provenance-matched canonical ID is available.")
  if (catalystState.activePhaseStatus !== "experimentally-resolved") push("active-phase-review", "P1", catalystState.id, "核验真实催化活性相", "Review the catalytically active phase", "Precursor, derived, operando, and post-reaction states are not yet experimentally resolved into one active-phase decision.")
  if (sourceDocument.license?.trainingUseAllowed !== true && !sourceDocument.license?.reviewStatus?.startsWith("resolved")) {
    push("license-review", "P1", sourceDocument.id, "核验模型训练使用许可", "Review machine-learning reuse license", "Metadata access does not establish permission to reuse full-text-derived claims for model training.")
  }
  return tasks
}
