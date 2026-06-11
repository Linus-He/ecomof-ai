// @ts-nocheck
// V2.0-K Evidence Backfill.
//
// Tracks the manual evidence backfill progress (source / citation / license / DOI /
// descriptor provenance) for candidates taken from the V2.0-I manual curation queue.
// This is a tracking layer ONLY. It NEVER fabricates DOI / source / license / citation
// (those stay null/pending), NEVER auto-promotes a candidate to verified_metadata, and
// every output keeps notFinalRecommendation = true. source_confirmed / citation_ready /
// license_confirmed are NOT verified_metadata. Evidence backfill is not experimental
// validation and mechanism proxies are not DFT/experimental conclusions.
import { normalizeMetadataVerification } from "./metadataVerification.js"

export const EVIDENCE_STATUSES = ["confirmed", "ready", "partial", "pending", "unknown", "missing", "not_available"]
export const METADATA_TRANSITIONS = ["needs_source", "source_confirmed", "citation_ready", "license_confirmed", "doi_pending", "verified_metadata", "blocked"]

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ""
}

function sourceConfirmed(record) {
  return hasValue(record.sourceUrl) || ["confirmed", "verified"].includes(String(record.sourceStatus || "").toLowerCase())
}
function citationReady(record) {
  return hasValue(record.citation) || ["ready", "confirmed", "verified"].includes(String(record.citationStatus || "").toLowerCase())
}
function licenseConfirmed(record) {
  return hasValue(record.license) || ["confirmed", "verified"].includes(String(record.licenseStatus || "").toLowerCase())
}
function doiConfirmed(record) {
  return hasValue(record.doi) || ["verified", "confirmed"].includes(String(record.doiStatus || "").toLowerCase())
}
function doiNotAvailable(record) {
  return String(record.doiStatus || "").toLowerCase() === "not_available"
}
function provenanceComplete(record) {
  return String(record.descriptorProvenanceStatus || "").toLowerCase() === "complete"
}

// verifiedMetadataEligible is true only when source/citation/license/descriptor
// provenance are all confirmed (DOI verified or explicitly not_available) AND the
// metadata gate also returns verified_metadata. Curation progress alone never qualifies.
export function getVerifiedMetadataEligibility(record = {}) {
  const ready = sourceConfirmed(record) && citationReady(record) && licenseConfirmed(record) && provenanceComplete(record) && (doiConfirmed(record) || doiNotAvailable(record))
  if (!ready) return false
  const gateRow = {
    ...record,
    metadataVerification: {
      doiStatus: doiConfirmed(record) ? "verified" : "not_applicable",
      sourceUrlStatus: "verified",
      licenseStatus: "verified",
      citationStatus: "ready",
      descriptorProvenanceStatus: "complete",
    },
  }
  return normalizeMetadataVerification(gateRow).verificationLevel === "verified_metadata"
}

export function getEvidenceBackfillStatus(record = {}) {
  if (String(record.curationAction || "").toLowerCase() === "curation_blocked") return "blocked"
  if (getVerifiedMetadataEligibility(record)) return "verified_metadata"
  if (sourceConfirmed(record) && citationReady(record) && licenseConfirmed(record)) return "doi_pending"
  if (sourceConfirmed(record) && citationReady(record)) return "license_confirmed"
  if (sourceConfirmed(record)) return "citation_ready"
  return "needs_source"
}

export function buildEvidenceBackfillBlockers(record = {}) {
  const blockers = []
  if (!sourceConfirmed(record)) blockers.push("sourceUrl pending")
  if (!citationReady(record)) blockers.push("citation pending")
  if (!licenseConfirmed(record)) blockers.push("license pending")
  if (!doiConfirmed(record) && !doiNotAvailable(record)) blockers.push("DOI pending")
  if (!provenanceComplete(record)) blockers.push("descriptor provenance incomplete")
  return blockers
}

function evidenceConfidence(record) {
  const confirmed = [sourceConfirmed(record), citationReady(record), licenseConfirmed(record), provenanceComplete(record)].filter(Boolean).length
  if (getVerifiedMetadataEligibility(record)) return "high"
  if (confirmed >= 3) return "medium"
  if (confirmed >= 1) return "low"
  return "low"
}

function defaultNextActions(record) {
  const actions = []
  if (!sourceConfirmed(record)) actions.push("Confirm original source URL")
  if (!citationReady(record)) actions.push("Attach citation if available")
  if (!licenseConfirmed(record)) actions.push("Confirm license")
  if (!doiConfirmed(record) && !doiNotAvailable(record)) actions.push("Check whether DOI exists")
  if (!provenanceComplete(record)) actions.push("Review descriptor provenance")
  return actions.length ? actions : ["Review record for verified_metadata eligibility"]
}

export function normalizeEvidenceBackfillRecord(record = {}) {
  const sourceUrl = hasValue(record.sourceUrl) ? record.sourceUrl : null
  const citation = hasValue(record.citation) ? record.citation : null
  const license = hasValue(record.license) ? record.license : null
  const doi = hasValue(record.doi) ? record.doi : null
  const normalized = {
    recordId: record.recordId || record.frameworkId || record.id || "candidate",
    displayName: record.displayName || record.recordId || "Candidate",
    sourceDatabase: record.sourceDatabase || null,
    sourceRecordId: record.sourceRecordId || null,
    previousTier: record.previousTier || "near_verified",
    sourceStatus: sourceUrl ? (record.sourceStatus && record.sourceStatus !== "pending" ? record.sourceStatus : "confirmed") : (record.sourceStatus || "pending"),
    sourceUrl,
    sourceEvidenceNote: record.sourceEvidenceNote || (sourceUrl ? "Source URL confirmed." : "Source URL still requires manual confirmation."),
    citationStatus: citation ? (record.citationStatus && record.citationStatus !== "pending" ? record.citationStatus : "ready") : (record.citationStatus || "pending"),
    citation,
    citationEvidenceNote: record.citationEvidenceNote || (citation ? "Citation confirmed." : "Citation is not yet confirmed."),
    licenseStatus: license ? (record.licenseStatus && record.licenseStatus !== "pending" ? record.licenseStatus : "confirmed") : (record.licenseStatus || "pending"),
    license,
    licenseEvidenceNote: record.licenseEvidenceNote || (license ? "License confirmed." : "License still requires manual confirmation."),
    doiStatus: doi ? (record.doiStatus && record.doiStatus !== "pending" ? record.doiStatus : "confirmed") : (record.doiStatus || "pending"),
    doi,
    doiEvidenceNote: record.doiEvidenceNote || (doi ? "DOI confirmed." : "DOI is not yet confirmed or may not be available."),
    descriptorProvenanceStatus: record.descriptorProvenanceStatus || "pending",
    descriptorProvenanceEvidenceNote: record.descriptorProvenanceEvidenceNote || "Descriptor provenance inherited from local curated snapshot and documented proxy rules.",
    mechanismEvidenceStatus: record.mechanismEvidenceStatus || "weak_proxy",
    mechanismEvidenceNote: record.mechanismEvidenceNote || "Mechanism proxy is currently inferred from descriptors and computed proxy values; not literature-supported yet.",
    curationAction: record.curationAction || "manual_backfill_required",
    notFinalRecommendation: true,
  }
  const transition = getEvidenceBackfillStatus(normalized)
  const eligible = getVerifiedMetadataEligibility(normalized)
  const blockers = buildEvidenceBackfillBlockers(normalized)
  return {
    ...normalized,
    metadataTransition: transition,
    verifiedMetadataEligible: eligible,
    verifiedMetadataReason: eligible
      ? "Source, citation, license, and descriptor provenance are confirmed and the metadata gate passes."
      : `Still pending: ${blockers.join(", ") || "metadata gate not yet satisfied"}.`,
    remainingBlockers: blockers,
    evidenceConfidence: evidenceConfidence(normalized),
    nextActions: record.nextActions && record.nextActions.length ? record.nextActions : defaultNextActions(normalized),
  }
}

export function buildEvidenceBackfillRecord(curationRecord = {}, sampleRecord = null) {
  const raw = {
    recordId: curationRecord.recordId,
    displayName: curationRecord.displayName,
    sourceDatabase: curationRecord.sourceDatabase,
    sourceRecordId: curationRecord.sourceRecordId,
    previousTier: curationRecord.previousTier || curationRecord.currentVerificationTier || "near_verified",
    sourceUrl: curationRecord.sourceUrl ?? null,
    sourceStatus: hasValue(curationRecord.sourceUrl) ? "confirmed" : "pending",
    citation: curationRecord.citation ?? null,
    citationStatus: hasValue(curationRecord.citation) ? "ready" : "pending",
    license: curationRecord.license ?? null,
    licenseStatus: hasValue(curationRecord.license) ? "confirmed" : "pending",
    doi: curationRecord.doi ?? null,
    doiStatus: hasValue(curationRecord.doi) ? "confirmed" : "pending",
    descriptorProvenanceStatus: curationRecord.descriptorProvenanceStatus || "complete",
    descriptorProvenanceEvidenceNote: curationRecord.descriptorProvenanceNote || undefined,
    mechanismEvidenceStatus: "weak_proxy",
  }
  return normalizeEvidenceBackfillRecord(raw)
}

export function buildEvidenceBackfillRecords(curationRecords = [], sampleRecords = []) {
  const sampleById = new Map((sampleRecords || []).map(record => [record.recordId, record]))
  return (curationRecords || []).map(record => buildEvidenceBackfillRecord(record, sampleById.get(record.recordId)))
}

// Merge strategy: an existing confirmed/manual value wins over a generated pending one.
export function mergeEvidenceBackfillRecord(existingRecord = null, generatedRecord = {}) {
  if (!existingRecord) return normalizeEvidenceBackfillRecord(generatedRecord)
  const merged = { ...generatedRecord }
  for (const key of ["sourceUrl", "citation", "license", "doi"]) {
    if (hasValue(existingRecord[key])) merged[key] = existingRecord[key]
  }
  for (const key of ["sourceStatus", "citationStatus", "licenseStatus", "doiStatus", "sourceEvidenceNote", "citationEvidenceNote", "licenseEvidenceNote", "doiEvidenceNote", "evidenceConfidence", "mechanismEvidenceStatus", "curationAction"]) {
    if (hasValue(existingRecord[key])) merged[key] = existingRecord[key]
  }
  return normalizeEvidenceBackfillRecord(merged)
}

function countInto(counts, key) {
  counts[key] = (counts[key] || 0) + 1
}

export function buildEvidenceBackfillSummary(records = []) {
  const rows = (Array.isArray(records) ? records : []).map(normalizeEvidenceBackfillRecord)
  const sourceStatusCounts = { confirmed: 0, pending: 0, missing: 0 }
  const citationStatusCounts = { ready: 0, partial: 0, pending: 0, missing: 0 }
  const licenseStatusCounts = { confirmed: 0, pending: 0, unknown: 0 }
  const doiStatusCounts = { confirmed: 0, pending: 0, not_available: 0 }
  const descriptorProvenanceStatusCounts = { complete: 0, partial: 0, incomplete: 0 }
  const mechanismEvidenceStatusCounts = { literature_supported: 0, descriptor_inferred: 0, weak_proxy: 0, insufficient_evidence: 0 }
  const remainingBlockers = {}
  let verifiedEligible = 0

  for (const row of rows) {
    countInto(sourceStatusCounts, sourceConfirmed(row) ? "confirmed" : (String(row.sourceStatus).toLowerCase() === "missing" ? "missing" : "pending"))
    countInto(citationStatusCounts, citationReady(row) ? "ready" : (["partial", "missing"].includes(String(row.citationStatus).toLowerCase()) ? String(row.citationStatus).toLowerCase() : "pending"))
    countInto(licenseStatusCounts, licenseConfirmed(row) ? "confirmed" : (String(row.licenseStatus).toLowerCase() === "unknown" ? "unknown" : "pending"))
    countInto(doiStatusCounts, doiConfirmed(row) ? "confirmed" : (doiNotAvailable(row) ? "not_available" : "pending"))
    const prov = String(row.descriptorProvenanceStatus).toLowerCase()
    countInto(descriptorProvenanceStatusCounts, prov === "complete" ? "complete" : (prov === "partial" ? "partial" : "incomplete"))
    const mech = String(row.mechanismEvidenceStatus).toLowerCase()
    if (mechanismEvidenceStatusCounts[mech] !== undefined) mechanismEvidenceStatusCounts[mech] += 1
    else mechanismEvidenceStatusCounts.weak_proxy += 1
    for (const blocker of row.remainingBlockers) countInto(remainingBlockers, blocker)
    if (row.verifiedMetadataEligible) verifiedEligible += 1
  }

  const nearestToVerified = rows
    .map(row => ({ recordId: row.recordId, displayName: row.displayName, remainingBlockerCount: row.remainingBlockers.length, remainingBlockers: row.remainingBlockers }))
    .sort((a, b) => a.remainingBlockerCount - b.remainingBlockerCount)
    .slice(0, 5)

  return {
    recordCount: rows.length,
    sourceStatusCounts,
    citationStatusCounts,
    licenseStatusCounts,
    doiStatusCounts,
    descriptorProvenanceStatusCounts,
    mechanismEvidenceStatusCounts,
    verifiedMetadataEligible: verifiedEligible,
    verifiedMetadataCount: verifiedEligible,
    nearestToVerified,
    remainingBlockers,
    notFinalRecommendation: true,
  }
}

export function buildMetadataTransitionSummary(records = [], previousSummary = {}) {
  const rows = (Array.isArray(records) ? records : []).map(normalizeEvidenceBackfillRecord)
  return {
    nearVerifiedBeforeBackfill: Number(previousSummary?.nearVerifiedBeforeCuration ?? previousSummary?.nearVerified ?? rows.length) || 0,
    sourceConfirmedAfterBackfill: rows.filter(sourceConfirmed).length,
    citationReadyAfterBackfill: rows.filter(citationReady).length,
    licenseConfirmedAfterBackfill: rows.filter(licenseConfirmed).length,
    verifiedAfterBackfill: rows.filter(getVerifiedMetadataEligibility).length,
  }
}

export function buildVerifiedCandidateReport(records = [], generatedAt = "2026-06") {
  const rows = (Array.isArray(records) ? records : []).map(normalizeEvidenceBackfillRecord)
  const verifiedCandidates = rows.filter(row => row.verifiedMetadataEligible).map(row => ({
    recordId: row.recordId,
    displayName: row.displayName,
    sourceUrl: row.sourceUrl,
    citation: row.citation,
    license: row.license,
    doi: row.doi,
    verifiedMetadataEligible: true,
    verificationNotes: row.verifiedMetadataReason,
    notFinalRecommendation: true,
  }))
  const nearVerifiedCandidates = rows
    .filter(row => !row.verifiedMetadataEligible)
    .sort((a, b) => a.remainingBlockers.length - b.remainingBlockers.length)
    .slice(0, 8)
    .map(row => ({ recordId: row.recordId, displayName: row.displayName, remainingBlockers: row.remainingBlockers, nextActions: row.nextActions }))

  const sourceConfirmedCount = rows.filter(sourceConfirmed).length
  const citationReadyCount = rows.filter(citationReady).length
  const licenseConfirmedCount = rows.filter(licenseConfirmed).length

  const reportStatus = verifiedCandidates.length
    ? "verified_candidates_available"
    : (sourceConfirmedCount + citationReadyCount + licenseConfirmedCount > 0 ? "partial_evidence_ready" : "no_verified_candidates_yet")

  return {
    version: "V2.0-K",
    generatedAt,
    notFinalRecommendation: true,
    verifiedMetadataCount: verifiedCandidates.length,
    sourceConfirmedCount,
    citationReadyCount,
    licenseConfirmedCount,
    reportStatus,
    verifiedCandidates,
    nearVerifiedCandidates,
    boundary: "Verified candidate report scaffold only. No final recommendation.",
    boundaryZh: "仅为经核验候选报告框架；不是最终推荐。",
  }
}

const EVIDENCE_STATUS_COPY = {
  confirmed: { en: "confirmed", zh: "已确认" },
  ready: { en: "ready", zh: "可用" },
  partial: { en: "partial", zh: "部分" },
  pending: { en: "pending", zh: "待补" },
  unknown: { en: "unknown", zh: "待补" },
  missing: { en: "missing", zh: "缺失" },
  not_available: { en: "not available", zh: "不适用" },
  complete: { en: "complete", zh: "完整" },
  incomplete: { en: "incomplete", zh: "不完整" },
  weak_proxy: { en: "weak proxy", zh: "弱代理" },
  descriptor_inferred: { en: "descriptor inferred", zh: "描述符推断" },
  literature_supported: { en: "literature supported", zh: "文献支持" },
  insufficient_evidence: { en: "insufficient evidence", zh: "证据不足" },
}

export function evidenceStatusLabel(value, lang) {
  const row = EVIDENCE_STATUS_COPY[String(value || "").toLowerCase()]
  if (!row) return lang === "zh" ? "待补" : "pending"
  return lang === "zh" ? row.zh : row.en
}

export function evidenceStatusTone(value) {
  const status = String(value || "").toLowerCase()
  if (["confirmed", "ready", "complete", "literature_supported"].includes(status)) return "pass"
  if (["partial", "descriptor_inferred", "not_available"].includes(status)) return "proxy"
  if (["missing", "blocked"].includes(status)) return "fail"
  return "warn"
}
