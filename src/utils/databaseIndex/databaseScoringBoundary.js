// @ts-nocheck
import { dbScopeLabel, dbText } from "./databaseIndexCopy"
import { descriptorCompletenessPercent, previewScore, provenanceCompletenessPercent, qualityTone, safeNumber, safeText } from "./databaseIndexFormatters"

const ALLOWED_SCOPES = new Set(["top_n_preview", "selected_index_part", "selected_candidates"])
const FULL_DATABASE_SCOPE = "full_database_precompute_required"

export function classifyScoringScope(scope = "selected_index_part") {
  const normalized = typeof scope === "string" ? scope : scope?.scope
  const scoringScope = normalized === "full_database" ? FULL_DATABASE_SCOPE : normalized || "selected_index_part"
  const browserAllowed = ALLOWED_SCOPES.has(scoringScope)
  return {
    scope: browserAllowed ? scoringScope : FULL_DATABASE_SCOPE,
    browserAllowed,
    workerAllowed: browserAllowed,
    reason: browserAllowed
      ? "Loaded preview/index data can be scored as a local loaded-scope dry run."
      : dbText("en", "fullDatabaseReason"),
    reasonZh: browserAllowed
      ? "已加载的预览/索引数据可以作为本地已加载范围试算。"
      : dbText("zh", "fullDatabaseReason"),
    notFinalRecommendation: true,
  }
}

export function canRunBrowserScoring(scope = "selected_index_part") {
  return classifyScoringScope(scope)
}

export function buildScoringBoundaryNotice(scope = "selected_index_part", lang = "en") {
  const classification = classifyScoringScope(scope)
  if (!classification.browserAllowed) return lang === "zh" ? classification.reasonZh : classification.reason
  return `${dbScopeLabel(classification.scope, lang)}: ${dbText(lang, "localLoadedScopeNotice")}`
}

function normalizeWorkerRecord(record = {}, index = 0) {
  const id = safeText(record.id || record.frameworkId || record.sourceRecordId, `loaded-record-${index + 1}`)
  return {
    id,
    frameworkId: safeText(record.frameworkId || id, id),
    displayName: safeText(record.displayName || record.name || id, id),
    sourceDatabase: safeText(record.sourceDatabase, "Pending"),
    sourceRecordId: safeText(record.sourceRecordId || id, id),
    dataQualityStatus: safeText(record.dataQualityStatus || record.qualityStatus, "pending"),
    previewScore: previewScore(record),
    descriptorCompleteness: descriptorCompletenessPercent(record),
    provenanceCompleteness: provenanceCompletenessPercent(record),
    detailRef: record.detailRef || null,
    notFinalRecommendation: true,
  }
}

export function buildWorkerScoringRequest(records = [], options = {}) {
  const classification = classifyScoringScope(options.scope || "selected_index_part")
  if (!classification.browserAllowed) {
    return {
      requestId: options.requestId || `db-score-denied-${Date.now()}`,
      createdAt: options.createdAt || new Date().toISOString(),
      scope: classification.scope,
      browserAllowed: false,
      workerAllowed: false,
      records: [],
      recordCount: 0,
      reason: classification.reason,
      reasonZh: classification.reasonZh,
      formulaVersion: "V2.0-D loaded-scope dry run boundary",
      notFinalRecommendation: true,
    }
  }

  const sourceRecords = Array.isArray(records) ? records : []
  return {
    requestId: options.requestId || `db-score-${classification.scope}-${Date.now()}`,
    createdAt: options.createdAt || new Date().toISOString(),
    scope: classification.scope,
    browserAllowed: true,
    workerAllowed: true,
    records: sourceRecords.map(normalizeWorkerRecord),
    recordCount: sourceRecords.length,
    formulaVersion: "V2.0-D loaded-scope dry run boundary",
    boundary: "Local loaded-scope dry run only; not full verified database screening and not a final verified recommendation.",
    boundaryZh: "仅本地已加载范围试算；不是经完整验证的全量数据库筛选，也不是最终验证推荐。",
    notFinalRecommendation: true,
  }
}

export function runLoadedScopeDryRun(request = {}) {
  const records = Array.isArray(request.records) ? request.records : []
  if (request.browserAllowed === false) {
    return {
      requestId: request.requestId,
      scope: request.scope || FULL_DATABASE_SCOPE,
      inputRecordCount: 0,
      scoredRecordCount: 0,
      skippedRecordCount: 0,
      skippedReasons: {},
      scoredRecords: [],
      formulaVersion: request.formulaVersion || "V2.0-D loaded-scope dry run boundary",
      boundary: request.reason || dbText("en", "fullDatabaseReason"),
      boundaryZh: request.reasonZh || dbText("zh", "fullDatabaseReason"),
      notFinalRecommendation: true,
    }
  }

  const skippedReasons = {}
  const scoredRecords = []
  for (const record of records) {
    const status = String(record.dataQualityStatus || "").toLowerCase()
    if (status.includes("reject")) {
      skippedReasons.rejected = (skippedReasons.rejected || 0) + 1
      continue
    }
    const descriptor = safeNumber(record.descriptorCompleteness)
    const provenance = safeNumber(record.provenanceCompleteness)
    if (descriptor <= 0) {
      skippedReasons.missingDescriptorCoverage = (skippedReasons.missingDescriptorCoverage || 0) + 1
      continue
    }
    const baseScore = Number.isFinite(Number(record.previewScore)) ? Number(record.previewScore) * 100 : 50
    const boundaryScore = Math.round((baseScore * 0.5 + descriptor * 0.3 + provenance * 0.2) * 10) / 10
    scoredRecords.push({
      id: record.id,
      displayName: record.displayName,
      qualityTone: qualityTone(record.dataQualityStatus),
      boundaryScore,
      notFinalRecommendation: true,
    })
  }

  return {
    requestId: request.requestId,
    scope: request.scope,
    inputRecordCount: records.length,
    scoredRecordCount: scoredRecords.length,
    skippedRecordCount: Math.max(0, records.length - scoredRecords.length),
    skippedReasons,
    scoredRecords,
    formulaVersion: request.formulaVersion || "V2.0-D loaded-scope dry run boundary",
    boundary: request.boundary || "Local loaded-scope dry run only; not full verified database screening and not a final verified recommendation.",
    boundaryZh: request.boundaryZh || "仅本地已加载范围试算；不是经完整验证的全量数据库筛选，也不是最终验证推荐。",
    notFinalRecommendation: true,
  }
}

export function buildWorkerScoringTrace(result = {}) {
  const createdAt = new Date().toISOString()
  return {
    runId: `db-worker-boundary-${createdAt.replace(/\D/g, "").slice(0, 14)}`,
    createdAt,
    scope: result.scope || "selected_index_part",
    inputRecordCount: safeNumber(result.inputRecordCount),
    scoredRecordCount: safeNumber(result.scoredRecordCount),
    skippedRecordCount: safeNumber(result.skippedRecordCount),
    skippedReasons: result.skippedReasons || {},
    formulaVersion: result.formulaVersion || "V2.0-D loaded-scope dry run boundary",
    boundary: result.boundary || "Local loaded-scope dry run only; not full verified database screening.",
    boundaryZh: result.boundaryZh || "仅本地已加载范围试算；不是经完整验证的全量数据库筛选。",
    notFinalRecommendation: true,
  }
}
