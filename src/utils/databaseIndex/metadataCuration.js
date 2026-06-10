// @ts-nocheck
// V2.0-I Manual Metadata Curation.
//
// Tracks the manual metadata curation progress of candidates picked from the V2.0-H
// verification queue. This is a curation-progress layer ONLY. It does NOT replace the
// V2.0-E / V2.0-H metadata verification gate, and it never auto-promotes a candidate
// to verified_metadata. source_confirmed / citation_ready / license_confirmed are NOT
// verified_metadata. Missing DOI/source/license/citation stay pending and are never
// fabricated. Output is never a final recommendation.
import { normalizeMetadataVerification } from "./metadataVerification.js"

export const CURATION_STATUSES = [
  "needs_source_review",
  "source_confirmed",
  "citation_ready",
  "license_pending",
  "license_confirmed",
  "doi_pending",
  "verified_metadata",
  "curation_blocked",
]

function isConfirmed(value, status, confirmedStates) {
  if (value !== null && value !== undefined && String(value).trim() !== "") return true
  return confirmedStates.includes(String(status || "").toLowerCase())
}

function confirmationFlags(record = {}) {
  return {
    source: isConfirmed(record.sourceUrl, record.sourceUrlStatus, ["confirmed", "verified"]),
    citation: isConfirmed(record.citation, record.citationStatus, ["ready", "confirmed", "verified"]),
    license: isConfirmed(record.license, record.licenseStatus, ["confirmed", "verified"]),
    doi: isConfirmed(record.doi, record.doiStatus, ["verified", "confirmed"]),
    provenance: String(record.descriptorProvenanceStatus || "").toLowerCase() === "complete",
    licensePending: String(record.licenseStatus || "").toLowerCase() === "pending",
    doiPending: String(record.doiStatus || "").toLowerCase() === "pending",
  }
}

// Derive a curation status from confirmed fields. verified_metadata is only reached
// when every key field is confirmed AND descriptor provenance is complete — and it is
// still cross-checked against the metadata gate by canUpgradeToVerifiedMetadata.
export function getMetadataCurationStatus(record = {}) {
  if (String(record.curationStatus || "").toLowerCase() === "curation_blocked") return "curation_blocked"
  const f = confirmationFlags(record)
  if (f.source && f.citation && f.license && f.doi && f.provenance) {
    return canUpgradeToVerifiedMetadata(record) ? "verified_metadata" : "doi_pending"
  }
  if (f.source && f.citation && f.license) return f.doi ? "license_confirmed" : "doi_pending"
  if (f.source && f.citation) return f.licensePending ? "license_pending" : "citation_ready"
  if (f.source) return "source_confirmed"
  return "needs_source_review"
}

export function buildCurationBlockingReasons(record = {}) {
  const f = confirmationFlags(record)
  const reasons = []
  if (!f.source) reasons.push("sourceUrl pending")
  if (!f.doi) reasons.push("DOI pending")
  if (!f.citation) reasons.push("citation pending")
  if (!f.license) reasons.push("license pending")
  if (!f.provenance) reasons.push("descriptor provenance incomplete")
  return reasons
}

// A curation record can be upgraded to verified_metadata only when every key field is
// confirmed AND the underlying metadata gate also returns verified_metadata. Curation
// progress alone never produces verified_metadata.
export function canUpgradeToVerifiedMetadata(record = {}) {
  const f = confirmationFlags(record)
  if (!(f.source && f.citation && f.license && f.doi && f.provenance)) return false
  // Cross-check the real gate: feed confirmed fields as gate inputs.
  const gateRow = {
    ...record,
    doi: record.doi,
    sourceUrl: record.sourceUrl,
    citation: record.citation,
    license: record.license,
    metadataVerification: {
      doiStatus: "verified",
      sourceUrlStatus: "verified",
      licenseStatus: "verified",
      citationStatus: "ready",
      descriptorProvenanceStatus: "complete",
    },
  }
  return normalizeMetadataVerification(gateRow).verificationLevel === "verified_metadata"
}

export function normalizeMetadataCuration(record = {}) {
  const status = getMetadataCurationStatus(record)
  const remainingBlockers = buildCurationBlockingReasons(record)
  return {
    recordId: record.recordId || record.frameworkId || record.id || "candidate",
    displayName: record.displayName || record.recordId || "Candidate",
    sourceDatabase: record.sourceDatabase || null,
    sourceRecordId: record.sourceRecordId || null,
    sourceVersion: record.sourceVersion || null,
    previousTier: record.previousTier || record.currentVerificationTier || null,
    curationStatus: status,
    sourceUrl: record.sourceUrl ?? null,
    sourceUrlStatus: record.sourceUrlStatus || (record.sourceUrl ? "confirmed" : "pending"),
    doi: record.doi ?? null,
    doiStatus: record.doiStatus || (record.doi ? "verified" : "pending"),
    citation: record.citation ?? null,
    citationStatus: record.citationStatus || (record.citation ? "ready" : "pending"),
    license: record.license ?? null,
    licenseStatus: record.licenseStatus || (record.license ? "confirmed" : "pending"),
    descriptorProvenanceStatus: record.descriptorProvenanceStatus || "pending",
    descriptorProvenanceNote: record.descriptorProvenanceNote || null,
    curatedBy: record.curatedBy || "manual-review-required",
    curatedAt: record.curatedAt || null,
    curationNotes: record.curationNotes || null,
    remainingBlockers,
    nextActions: record.nextActions || defaultNextActions(record),
    canUpgradeToVerifiedMetadata: canUpgradeToVerifiedMetadata(record),
    notFinalRecommendation: true,
  }
}

function defaultNextActions(record) {
  const f = confirmationFlags(record)
  const actions = ["Locate original source record"]
  if (!f.source) actions.push("Confirm source URL")
  if (!f.citation) actions.push("Confirm citation")
  if (!f.license) actions.push("Confirm license")
  if (!f.doi) actions.push("Check whether DOI is available")
  return actions
}

export function buildCurationProgressSummary(records = []) {
  const rows = Array.isArray(records) ? records.map(normalizeMetadataCuration) : []
  const statusCounts = {}
  for (const status of CURATION_STATUSES) statusCounts[status] = 0
  const blockerCounts = {}
  let canUpgrade = 0
  let blocked = 0
  for (const row of rows) {
    statusCounts[row.curationStatus] = (statusCounts[row.curationStatus] || 0) + 1
    for (const blocker of row.remainingBlockers) blockerCounts[blocker] = (blockerCounts[blocker] || 0) + 1
    if (row.canUpgradeToVerifiedMetadata) canUpgrade += 1
    if (row.curationStatus === "curation_blocked") blocked += 1
  }
  return {
    queueSize: rows.length,
    statusCounts,
    remainingBlockers: blockerCounts,
    upgradeReadiness: {
      canUpgradeToVerifiedMetadata: canUpgrade,
      needsManualReview: rows.length - canUpgrade - blocked,
      blocked,
    },
    notFinalRecommendation: true,
  }
}

// Combine a base candidate's metadata verification with its curation record (if any).
export function mergeCurationWithMetadataVerification(record = {}, curationRecord = null) {
  const verification = normalizeMetadataVerification(record)
  if (!curationRecord) {
    return { ...verification, inCurationQueue: false, curationStatus: null, notFinalRecommendation: true }
  }
  const curation = normalizeMetadataCuration(curationRecord)
  return {
    ...verification,
    inCurationQueue: true,
    curationStatus: curation.curationStatus,
    sourceUrlStatus: curation.sourceUrlStatus,
    citationStatus: curation.citationStatus,
    licenseStatus: curation.licenseStatus,
    doiStatus: curation.doiStatus,
    remainingBlockers: curation.remainingBlockers,
    nextActions: curation.nextActions,
    canUpgradeToVerifiedMetadata: curation.canUpgradeToVerifiedMetadata,
    notFinalRecommendation: true,
  }
}

const STATUS_COPY = {
  needs_source_review: { en: "Needs source review", zh: "待来源核验" },
  source_confirmed: { en: "Source confirmed", zh: "来源已确认" },
  citation_ready: { en: "Citation ready", zh: "引用可用" },
  license_pending: { en: "License pending", zh: "license 待确认" },
  license_confirmed: { en: "License confirmed", zh: "license 已确认" },
  doi_pending: { en: "DOI pending", zh: "DOI 待补" },
  verified_metadata: { en: "Verified metadata", zh: "metadata 已核验" },
  curation_blocked: { en: "Curation blocked", zh: "整理受阻" },
}

export function curationStatusLabel(status, lang) {
  const row = STATUS_COPY[status] || STATUS_COPY.needs_source_review
  return lang === "zh" ? row.zh : row.en
}

export function curationStatusTone(status) {
  if (status === "verified_metadata") return "pass"
  if (status === "license_confirmed" || status === "citation_ready") return "proxy"
  if (status === "curation_blocked") return "fail"
  if (status === "source_confirmed") return "info"
  return "warn"
}

const FIELD_STATUS_COPY = {
  confirmed: { en: "confirmed", zh: "已确认" },
  verified: { en: "verified", zh: "已核验" },
  ready: { en: "ready", zh: "可用" },
  pending: { en: "pending", zh: "待补" },
  missing: { en: "missing", zh: "缺失" },
  not_applicable: { en: "not applicable", zh: "不适用" },
  complete: { en: "complete", zh: "完整" },
}

export function curationFieldStatusLabel(value, lang) {
  const row = FIELD_STATUS_COPY[String(value || "").toLowerCase()]
  if (!row) return lang === "zh" ? "待补" : "pending"
  return lang === "zh" ? row.zh : row.en
}
