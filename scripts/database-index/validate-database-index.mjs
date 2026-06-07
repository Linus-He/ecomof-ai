import fs from "node:fs"
import path from "node:path"
import {
  DATABASE_INDEX_DIR,
  DATASET_MODE,
  collectJsonFiles,
  readJson,
  writeJson,
} from "./database-index-utils.mjs"

const dryRun = process.argv.includes("--dry-run")

const forbiddenIndexFields = new Set([
  "fieldSources",
  "evidenceRecords",
  "sourceDoi",
  "citation",
  "license",
  "trace",
  "algorithmTrace",
])

function assert(condition, message, issues) {
  if (!condition) issues.push(message)
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(DATABASE_INDEX_DIR, relativePath))
}

function partRecords(relativePath) {
  const part = readJson(path.join(DATABASE_INDEX_DIR, relativePath))
  return Array.isArray(part) ? part : (part.records || [])
}

const DOI_METADATA_KEYS = new Set(["sourceDoi", "doi"])
const STRING_METADATA_KEYS = new Set(["citation", "license", "sourceUrl", "sourceTitle"])
const ARRAY_CONTAINER_KEYS = new Set(["records", "items", "data", "results"])
const COUNT_KEYS = new Set([
  "recordCount",
  "totalRecords",
  "frameworkRecords",
  "qmofDescriptorRecords",
  "evidenceRecords",
  "matchedFrameworks",
  "unmatchedRecords",
  "unmatchedQmofDescriptorRecords",
  "readyForScoring",
  "needsReview",
  "rejected",
  "withSourceDoi",
  "withCitation",
  "withLicense",
  "withSourceDatabase",
  "withSourceRecordId",
  "finalRecommendationCount",
  "detailCount",
  "available",
  "total",
  "valid",
  "invalid",
  "issueCount",
  "warningCount",
  "partCount",
])
const PERCENT_KEYS = new Set([
  "percent",
  "coveragePercent",
  "doiCoveragePercent",
  "fieldSourceCoveragePercent",
  "descriptorCoveragePercent",
  "evidenceIdsCoveragePercent",
])

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function looksLikeDoi(value) {
  const text = String(value || "").trim()
  return /^10\.\d{4,9}\/\S+$/i.test(text) || /^https?:\/\/(dx\.)?doi\.org\/10\.\d{4,9}\/\S+$/i.test(text)
}

function isCountKey(key) {
  return COUNT_KEYS.has(key) || /Count$/.test(key)
}

function isPercentKey(key) {
  return PERCENT_KEYS.has(key) || /Percent$/.test(key)
}

function isArrayContainerKey(key) {
  return ARRAY_CONTAINER_KEYS.has(key)
}

function validateArrayContainerField(key, item, issues, filePath, keyPath) {
  if (!isArrayContainerKey(key)) return
  assert(Array.isArray(item), `${filePath} ${keyPath}.${key} must be an array container`, issues)
}

function validateStatisticsField(key, item, issues, filePath, keyPath) {
  if (!isCountKey(key) && !isPercentKey(key)) return
  assert(typeof item === "number" && Number.isFinite(item), `${filePath} ${keyPath}.${key} must be a finite number`, issues)
  if (typeof item !== "number" || !Number.isFinite(item)) return
  if (isCountKey(key)) assert(item >= 0, `${filePath} ${keyPath}.${key} must be >= 0`, issues)
  if (isPercentKey(key)) assert(item >= 0 && item <= 100, `${filePath} ${keyPath}.${key} must be between 0 and 100`, issues)
}

function validateMetadataField(key, item, issues, warnings, filePath, keyPath) {
  if (DOI_METADATA_KEYS.has(key)) {
    if (item === undefined || item === null || item === "") {
      warnings.push(`${filePath} ${keyPath}.${key} pending verification`)
      return
    }
    if (typeof item !== "string") {
      issues.push(`${filePath} ${keyPath}.${key} must be null/empty or a DOI string`)
      return
    }
    assert(looksLikeDoi(item), `${filePath} ${keyPath}.${key} does not look like a DOI or DOI URL`, issues)
    return
  }

  if (STRING_METADATA_KEYS.has(key)) {
    if (item === undefined || item === null || item === "") {
      warnings.push(`${filePath} ${keyPath}.${key} pending verification`)
      return
    }
    assert(typeof item === "string", `${filePath} ${keyPath}.${key} must be null/empty or a string`, issues)
  }
}

function walkMetadataAndStats(value, issues, warnings, filePath, keyPath = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkMetadataAndStats(item, issues, warnings, filePath, `${keyPath}[${index}]`))
    return
  }
  if (!isPlainObject(value)) return
  Object.entries(value).forEach(([key, item]) => {
    validateArrayContainerField(key, item, issues, filePath, keyPath)
    validateStatisticsField(key, item, issues, filePath, keyPath)
    validateMetadataField(key, item, issues, warnings, filePath, keyPath)
    walkMetadataAndStats(item, issues, warnings, filePath, `${keyPath}.${key}`)
  })
}

function validateIndexPart(relativePath, part, issues) {
  assert(isPlainObject(part), `${relativePath} must be an object with records array`, issues)
  assert(part.datasetMode === DATASET_MODE, `${relativePath} datasetMode must be ${DATASET_MODE}`, issues)
  assert(Array.isArray(part.records), `${relativePath} top-level records must be an array`, issues)
  if (!Array.isArray(part.records)) return []
  assert(part.records.length > 0, `${relativePath} records must not be empty`, issues)
  if (Number.isFinite(Number(part.recordCount))) {
    assert(Number(part.recordCount) === part.records.length, `${relativePath} recordCount must match records.length`, issues)
  }

  part.records.forEach((record, index) => {
    const label = `${relativePath} records[${index}]`
    assert(isPlainObject(record), `${label} must be an object`, issues)
    if (!isPlainObject(record)) return
    assert(Boolean(record.id), `${label} requires id`, issues)
    assert(Boolean(record.sourceDatabase), `${label} requires sourceDatabase`, issues)
    assert(Boolean(record.sourceRecordId), `${label} requires sourceRecordId`, issues)
    assert("detailRef" in record, `${label} requires detailRef key for detail-on-demand contract`, issues)
    for (const field of forbiddenIndexFields) {
      assert(!(field in record), `${relativePath} ${record.id || "record"} includes forbidden heavy field ${field}`, issues)
    }
    if (record.detailRef) {
      assert(typeof record.detailRef === "string", `${relativePath} ${record.id} detailRef must be a string or null`, issues)
      assert(fileExists(record.detailRef), `${relativePath} ${record.id} detailRef missing: ${record.detailRef}`, issues)
    }
    if (record.dataQualityStatus === "needs_review" && record.finalRecommendationEligible === true) {
      issues.push(`${relativePath} ${record.id} is needs_review but finalRecommendationEligible=true`)
    }
  })

  return part.records
}

function main() {
  const issues = []
  const warnings = []
  const manifestPath = path.join(DATABASE_INDEX_DIR, "manifest.json")
  assert(fs.existsSync(manifestPath), "manifest.json is missing", issues)
  const manifest = readJson(manifestPath, {})

  assert(manifest.version === "V2.0-A", "manifest.version must be V2.0-A", issues)
  assert(manifest.datasetMode === DATASET_MODE, `manifest.datasetMode must be ${DATASET_MODE}`, issues)

  Object.values(manifest.files || {}).forEach(relativePath => {
    assert(fileExists(relativePath), `manifest references missing file ${relativePath}`, issues)
  })

  const allPartPaths = [
    ...(manifest.indexParts?.coreMof || []),
    ...(manifest.indexParts?.qmof || []),
  ]
  allPartPaths.forEach(relativePath => {
    assert(fileExists(relativePath), `manifest references missing index part ${relativePath}`, issues)
    if (!fileExists(relativePath)) return
    validateIndexPart(relativePath, readJson(path.join(DATABASE_INDEX_DIR, relativePath)), issues)
  })

  const topCandidatesPath = path.join(DATABASE_INDEX_DIR, manifest.files?.topCandidates || "organic_acid_precomputed_top_candidates.json")
  const topCandidates = readJson(topCandidatesPath, {})
  assert(topCandidates.notFullScreening === true, "top candidate preview must set notFullScreening=true", issues)
  assert(Number(topCandidates.finalRecommendationCount || 0) === 0, "V2.0-A must not emit final recommendations", issues)
  ;(topCandidates.topCandidates || []).forEach(candidate => {
    assert(candidate.dataQualityStatus !== "needs_review", `${candidate.frameworkId} needs_review candidate appears in top preview`, issues)
    assert(candidate.notFinalRecommendation === true, `${candidate.frameworkId} must be marked notFinalRecommendation`, issues)
    if (candidate.detailRef) assert(fileExists(candidate.detailRef), `${candidate.frameworkId} top candidate detailRef missing`, issues)
  })

  collectJsonFiles(DATABASE_INDEX_DIR).forEach(filePath => {
    const value = readJson(filePath)
    walkMetadataAndStats(value, issues, warnings, path.relative(DATABASE_INDEX_DIR, filePath).replace(/\\/g, "/"))
  })

  const report = {
    datasetMode: manifest.datasetMode || "missing",
    checkedAt: new Date().toISOString(),
    status: issues.length ? "failed" : "passed",
    issueCount: issues.length,
    warningCount: warnings.length,
    issues,
    warnings,
    checks: [
      "manifest references",
      "lightweight index fields",
      "index part records array contract",
      "detailRef existence",
      "metadata DOI/citation/license validation",
      "coverage count/percent range validation",
      "array container field validation",
      "needs-review exclusion from final recommendation",
      "top candidate preview boundary",
    ],
  }
  writeJson(path.join(DATABASE_INDEX_DIR, "validation_report.json"), report, { dryRun })
  if (issues.length) {
    console.error(JSON.stringify(report, null, 2))
    process.exit(1)
  }
  console.log(`Database index validation passed: ${allPartPaths.length} part(s), ${collectJsonFiles(DATABASE_INDEX_DIR).length} JSON file(s).`)
}

main()
