// @ts-nocheck
import { provenanceCompletenessPercent, safeText } from "./databaseIndexFormatters"

// V2.0-E metadata verification gate.
// This models metadata verification *status* and gates verified recommendation
// eligibility. It does NOT perform live DOI/source verification, and it does NOT
// modify OACS/DMRS scoring. Candidates that lack a traceable source, DOI, license,
// or descriptor provenance stay in preview only and cannot become verified
// recommendations.

const VERIFICATION_LEVELS = ["verified_metadata", "partial_metadata", "preview_only", "blocked"]

function hasValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  const rendered = String(value).trim()
  return Boolean(rendered) && !["undefined", "null", "nan", "pending", "missing", "unknown", "n/a"].includes(rendered.toLowerCase())
}

function firstValue(...candidates) {
  for (const candidate of candidates) {
    if (hasValue(candidate)) return candidate
  }
  return null
}

function deriveDoiStatus(row) {
  if (hasValue(firstValue(row.sourceDoi, row.doi))) return "verified"
  return "missing"
}

function deriveSourceUrlStatus(row) {
  if (hasValue(firstValue(row.sourceUrl, row.url))) return "verified"
  // A resolvable source database + record id is treated as a pending source link
  // that still needs URL/landing-page verification rather than a confirmed link.
  if (hasValue(row.sourceDatabase) && hasValue(firstValue(row.sourceRecordId, row.frameworkId, row.id))) return "pending"
  return "missing"
}

function deriveLicenseStatus(row) {
  if (hasValue(row.license)) return "verified"
  if (hasValue(row.licenseStatus)) return String(row.licenseStatus)
  return "unknown"
}

function deriveCitationStatus(row) {
  if (hasValue(row.citation)) return "ready"
  if (hasValue(firstValue(row.sourceDoi, row.doi)) || (hasValue(row.sourceDatabase) && hasValue(firstValue(row.sourceRecordId, row.frameworkId, row.id)))) return "partial"
  return "missing"
}

function deriveProvenanceStatus(row) {
  const fieldSources = row.fieldSources && typeof row.fieldSources === "object" ? Object.keys(row.fieldSources).length : 0
  const percent = provenanceCompletenessPercent(row)
  if (percent >= 70 || fieldSources >= 4) return "complete"
  if (percent >= 30 || fieldSources >= 1 || hasValue(row.sourceDatabase)) return "partial"
  return "missing"
}

function deriveRetrievedAtStatus(row) {
  return hasValue(row.retrievedAt) ? "present" : "missing"
}

// Normalize raw row metadata into the structured verification status object.
// Tolerates missing fields and respects any explicit row.metadataVerification overrides.
export function normalizeMetadataVerification(row = {}) {
  const provided = row && typeof row.metadataVerification === "object" && row.metadataVerification ? row.metadataVerification : {}
  const status = {
    doiStatus: provided.doiStatus || deriveDoiStatus(row),
    sourceUrlStatus: provided.sourceUrlStatus || deriveSourceUrlStatus(row),
    licenseStatus: provided.licenseStatus || deriveLicenseStatus(row),
    citationStatus: provided.citationStatus || deriveCitationStatus(row),
    descriptorProvenanceStatus: provided.descriptorProvenanceStatus || deriveProvenanceStatus(row),
    retrievedAtStatus: provided.retrievedAtStatus || deriveRetrievedAtStatus(row),
  }
  const blockingReasons = buildMetadataBlockingReasons(row, status)
  const warnings = buildMetadataWarnings(row, status)
  const level = provided.verificationLevel && VERIFICATION_LEVELS.includes(provided.verificationLevel)
    ? provided.verificationLevel
    : computeVerificationLevel(status, blockingReasons)
  const eligible = level === "verified_metadata"
  return {
    ...status,
    verificationLevel: level,
    verifiedRecommendationEligible: typeof provided.verifiedRecommendationEligible === "boolean" ? provided.verifiedRecommendationEligible : eligible,
    blockingReasons,
    warnings,
  }
}

function resolveStatus(row, key, derive) {
  const provided = row && typeof row.metadataVerification === "object" && row.metadataVerification ? row.metadataVerification : {}
  return provided[key] || derive(row)
}

// Reasons that block a candidate from verified recommendation eligibility.
export function buildMetadataBlockingReasons(row = {}, status) {
  const doiStatus = status?.doiStatus || resolveStatus(row, "doiStatus", deriveDoiStatus)
  const sourceUrlStatus = status?.sourceUrlStatus || resolveStatus(row, "sourceUrlStatus", deriveSourceUrlStatus)
  const citationStatus = status?.citationStatus || resolveStatus(row, "citationStatus", deriveCitationStatus)
  const descriptorProvenanceStatus = status?.descriptorProvenanceStatus || resolveStatus(row, "descriptorProvenanceStatus", deriveProvenanceStatus)

  const reasons = []
  if (doiStatus !== "verified" && doiStatus !== "not_applicable") reasons.push("doiMissing")
  if (sourceUrlStatus !== "verified") reasons.push("sourcePending")
  if (descriptorProvenanceStatus === "missing") reasons.push("descriptorProvenanceMissing")
  if (descriptorProvenanceStatus === "partial") reasons.push("descriptorProvenanceIncomplete")
  if (citationStatus === "missing") reasons.push("citationMissing")
  return reasons
}

// Softer issues that do not necessarily block eligibility on their own.
export function buildMetadataWarnings(row = {}, status) {
  const licenseStatus = status?.licenseStatus || resolveStatus(row, "licenseStatus", deriveLicenseStatus)
  const retrievedAtStatus = status?.retrievedAtStatus || resolveStatus(row, "retrievedAtStatus", deriveRetrievedAtStatus)

  const warnings = []
  if (licenseStatus === "unknown" || licenseStatus === "missing") warnings.push("licensePending")
  if (retrievedAtStatus === "missing") warnings.push("retrievedAtMissing")
  return warnings
}

function computeVerificationLevel(status, blockingReasons) {
  const { doiStatus, sourceUrlStatus, citationStatus, descriptorProvenanceStatus } = status
  const sourceMissing = sourceUrlStatus === "missing"
  // Severe source/provenance loss → cannot participate in verified screening.
  if (sourceMissing && descriptorProvenanceStatus === "missing") return "blocked"
  if (descriptorProvenanceStatus === "missing") return "blocked"

  const fullyVerified =
    doiStatus === "verified" &&
    sourceUrlStatus === "verified" &&
    citationStatus === "ready" &&
    descriptorProvenanceStatus === "complete"
  if (fullyVerified) return "verified_metadata"

  // Traceable to a source and partially complete → partial metadata.
  const traceable = sourceUrlStatus !== "missing" && descriptorProvenanceStatus !== "missing"
  if (traceable && (doiStatus === "verified" || citationStatus !== "missing") && descriptorProvenanceStatus === "complete") return "partial_metadata"

  return "preview_only"
}

export function getMetadataVerificationLevel(row = {}) {
  return normalizeMetadataVerification(row).verificationLevel
}

export function isVerifiedRecommendationEligible(row = {}) {
  return normalizeMetadataVerification(row).verifiedRecommendationEligible === true
}

const LEVEL_COPY = {
  verified_metadata: { en: "verified metadata", zh: "metadata 已核验" },
  partial_metadata: { en: "partial metadata", zh: "metadata 部分完整" },
  preview_only: { en: "preview only", zh: "仅限预览" },
  blocked: { en: "blocked", zh: "暂不可用" },
}

const REASON_COPY = {
  doiMissing: { en: "DOI missing or pending", zh: "DOI 缺失或待核验" },
  sourcePending: { en: "Source pending verification", zh: "来源待核验" },
  descriptorProvenanceMissing: { en: "Descriptor provenance incomplete", zh: "描述符溯源不完整" },
  descriptorProvenanceIncomplete: { en: "Descriptor provenance incomplete", zh: "描述符溯源不完整" },
  citationMissing: { en: "Citation missing", zh: "引用信息缺失" },
  licensePending: { en: "License pending verification", zh: "license 待核验" },
  retrievedAtMissing: { en: "Retrieval timestamp missing", zh: "抓取时间缺失" },
}

export function metadataLevelLabel(level, lang) {
  const row = LEVEL_COPY[level] || LEVEL_COPY.preview_only
  return lang === "zh" ? row.zh : row.en
}

export function metadataReasonLabel(reasonKey, lang) {
  const row = REASON_COPY[reasonKey]
  if (!row) return reasonKey
  return lang === "zh" ? row.zh : row.en
}

export function metadataLevelTone(level) {
  if (level === "verified_metadata") return "pass"
  if (level === "partial_metadata") return "proxy"
  if (level === "blocked") return "fail"
  return "warn"
}

// Build a localized, UI-ready summary for a candidate.
export function buildMetadataVerificationSummary(row = {}, lang = "en") {
  const verification = normalizeMetadataVerification(row)
  const eligible = verification.verifiedRecommendationEligible === true
  const blockingReasons = verification.blockingReasons.map(reason => metadataReasonLabel(reason, lang))
  const warnings = verification.warnings.map(reason => metadataReasonLabel(reason, lang))

  const ineligibleEn = "This candidate cannot yet support a final recommendation"
  const ineligibleZh = "该候选目前不能作为最终推荐依据"
  const eligibleEn = "Eligible for verified recommendation"
  const eligibleZh = "可进入经核验推荐"

  const summaryEn = eligible
    ? eligibleEn
    : `${ineligibleEn}: ${(blockingReasons.length ? verification.blockingReasons.map(r => metadataReasonLabel(r, "en")) : ["preview only"]).join("; ")}.`
  const summaryZh = eligible
    ? eligibleZh
    : `${ineligibleZh}：${(blockingReasons.length ? verification.blockingReasons.map(r => metadataReasonLabel(r, "zh")) : ["仅限预览"]).join("、")}。`

  return {
    id: safeText(row.frameworkId || row.id || row.sourceRecordId, "candidate"),
    level: verification.verificationLevel,
    eligible,
    status: {
      doiStatus: verification.doiStatus,
      sourceUrlStatus: verification.sourceUrlStatus,
      licenseStatus: verification.licenseStatus,
      citationStatus: verification.citationStatus,
      descriptorProvenanceStatus: verification.descriptorProvenanceStatus,
      retrievedAtStatus: verification.retrievedAtStatus,
    },
    blockingReasons,
    warnings,
    summaryEn,
    summaryZh,
    summary: lang === "zh" ? summaryZh : summaryEn,
  }
}

// Count verification levels across a list of records (for panel summaries).
export function summarizeMetadataVerification(records = []) {
  const rows = Array.isArray(records) ? records : []
  const counts = { verified_metadata: 0, partial_metadata: 0, preview_only: 0, blocked: 0 }
  for (const row of rows) {
    const level = getMetadataVerificationLevel(row)
    counts[level] = (counts[level] || 0) + 1
  }
  return {
    total: rows.length,
    ...counts,
    eligible: counts.verified_metadata,
  }
}

const STATUS_VALUE_COPY = {
  verified: { en: "verified", zh: "已核验" },
  pending: { en: "pending", zh: "待核验" },
  missing: { en: "missing", zh: "缺失" },
  not_applicable: { en: "not applicable", zh: "不适用" },
  unknown: { en: "unknown", zh: "待核验" },
  ready: { en: "ready", zh: "可用" },
  partial: { en: "partial", zh: "部分完整" },
  complete: { en: "complete", zh: "完整" },
  present: { en: "present", zh: "已记录" },
}

export function metadataStatusValueLabel(value, lang) {
  const row = STATUS_VALUE_COPY[String(value || "").toLowerCase()]
  if (!row) return value || (lang === "zh" ? "待核验" : "pending")
  return lang === "zh" ? row.zh : row.en
}

export function metadataStatusTone(value) {
  const status = String(value || "").toLowerCase()
  if (["verified", "ready", "complete", "present"].includes(status)) return "pass"
  if (["partial", "pending"].includes(status)) return "proxy"
  if (status === "not_applicable") return "info"
  return "warn"
}
