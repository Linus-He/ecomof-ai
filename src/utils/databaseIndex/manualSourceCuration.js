// @ts-nocheck
// V2.0-L Manual Source Curation.
//
// Records the result of manual source verification for the candidates that are closest
// to verified metadata, and merges those results into the V2.0-K evidence backfill.
// This is an evidence-tracking layer ONLY. It NEVER fabricates DOI / citation / license
// / source URL: when something cannot be confirmed it stays pending / unknown /
// not_available. source_confirmed / citation_ready / license_confirmed are NOT
// verified_metadata, and an unresolved ambiguity warning always blocks verified_metadata
// eligibility. Every output keeps notFinalRecommendation = true.
import { normalizeEvidenceBackfillRecord } from "./evidenceBackfill.js"

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

// Warnings that prevent treating a confirmed source as a strict match for the record.
export function buildAmbiguityWarnings(record = {}) {
  const warnings = Array.isArray(record.ambiguityWarnings) ? [...record.ambiguityWarnings] : []
  const target = String(record.targetMaterialName || "").trim()
  const display = String(record.displayName || "").trim()
  // A curated/synthetic record id cannot be strictly mapped to an external source offline.
  if (/^COREMOF_\d+$/.test(String(record.recordId || "")) && !record.sourceRecordVerified) {
    warnings.push("Record id is a curated fixture identifier; the material name matches a known MOF but the exact source record cannot be strictly confirmed offline.")
  }
  if (target && display && !display.toLowerCase().includes(target.toLowerCase().split("(")[0].trim())) {
    warnings.push("Target material name and record display name only match loosely; treat the source as material-level, not record-strict.")
  }
  // De-duplicate.
  return [...new Set(warnings)]
}

// Verified-metadata readiness: requires the full evidence loop confirmed (DOI verified
// or explicitly not_available) AND no unresolved ambiguity warning.
export function getVerifiedMetadataReadiness(record = {}) {
  const ambiguity = buildAmbiguityWarnings(record)
  const checks = {
    source: sourceConfirmed(record),
    citation: citationReady(record),
    license: licenseConfirmed(record),
    provenance: provenanceComplete(record),
    doi: doiConfirmed(record) || doiNotAvailable(record),
  }
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
  if (ambiguity.length) {
    return { eligible: false, reason: `Blocked by ambiguity: ${ambiguity[0]}`, missing, ambiguityWarnings: ambiguity }
  }
  if (missing.length) {
    return { eligible: false, reason: `Still pending: ${missing.join(", ")}.`, missing, ambiguityWarnings: ambiguity }
  }
  return { eligible: true, reason: "Source, citation, license, and descriptor provenance confirmed (DOI verified or not_available) with no ambiguity.", missing, ambiguityWarnings: ambiguity }
}

export function buildSourceCurationBlockers(record = {}) {
  const blockers = []
  if (!sourceConfirmed(record)) blockers.push("sourceUrl pending")
  if (!citationReady(record)) blockers.push("citation pending")
  if (!licenseConfirmed(record)) blockers.push("license pending")
  if (!doiConfirmed(record) && !doiNotAvailable(record)) blockers.push("DOI pending")
  if (!provenanceComplete(record)) blockers.push("descriptor provenance incomplete")
  if (buildAmbiguityWarnings(record).length) blockers.push("ambiguity unresolved")
  return blockers
}

export function normalizeManualSourceCuration(record = {}) {
  const sourceUrl = hasValue(record.sourceUrl) ? record.sourceUrl : null
  const citation = hasValue(record.citation) ? record.citation : null
  const license = hasValue(record.license) ? record.license : null
  const doi = hasValue(record.doi) ? record.doi : null
  const base = {
    recordId: record.recordId || "candidate",
    displayName: record.displayName || record.recordId || "Candidate",
    targetMaterialName: record.targetMaterialName || null,
    previousTier: record.previousTier || "near_verified",
    sourceSearchStatus: record.sourceSearchStatus || "searched",
    sourceStatus: sourceUrl ? (record.sourceStatus && record.sourceStatus !== "pending" ? record.sourceStatus : "confirmed") : (record.sourceStatus || "pending"),
    sourceUrl,
    sourceEvidenceNote: record.sourceEvidenceNote || (sourceUrl ? "Source confirmed." : "Source URL still requires manual confirmation."),
    citationStatus: citation ? (record.citationStatus && record.citationStatus !== "pending" ? record.citationStatus : "ready") : (record.citationStatus || "pending"),
    citation,
    citationEvidenceNote: record.citationEvidenceNote || (citation ? "Citation recorded." : "Citation is not yet confirmed."),
    licenseStatus: license ? (record.licenseStatus && record.licenseStatus !== "pending" ? record.licenseStatus : "confirmed") : (record.licenseStatus || "pending"),
    license,
    licenseEvidenceNote: record.licenseEvidenceNote || (license ? "License recorded." : "License still requires manual confirmation."),
    doiStatus: doi ? (record.doiStatus && record.doiStatus !== "pending" ? record.doiStatus : "confirmed") : (record.doiStatus || "pending"),
    doi,
    doiEvidenceNote: record.doiEvidenceNote || (doi ? "DOI recorded." : "DOI not confirmed offline; kept pending."),
    descriptorProvenanceStatus: record.descriptorProvenanceStatus || "pending",
    descriptorProvenanceEvidenceNote: record.descriptorProvenanceEvidenceNote || "Descriptor provenance inherited from local curated snapshot and documented proxy rules.",
    curationConfidence: record.curationConfidence || "low",
    curatedAt: record.curatedAt || "2026-06",
    curatedBy: record.curatedBy || "manual-source-curation",
    notFinalRecommendation: true,
  }
  const readiness = getVerifiedMetadataReadiness({ ...base, ambiguityWarnings: record.ambiguityWarnings, sourceRecordVerified: record.sourceRecordVerified })
  return {
    ...base,
    ambiguityWarnings: readiness.ambiguityWarnings,
    verifiedMetadataEligible: readiness.eligible,
    verifiedMetadataReason: record.verifiedMetadataReason || readiness.reason,
    remainingBlockers: buildSourceCurationBlockers({ ...base, ambiguityWarnings: record.ambiguityWarnings, sourceRecordVerified: record.sourceRecordVerified }),
    nextActions: record.nextActions && record.nextActions.length ? record.nextActions : defaultNextActions(base),
  }
}

function defaultNextActions(record) {
  const actions = []
  if (!sourceConfirmed(record)) actions.push("Locate and confirm the original source URL")
  if (!citationReady(record)) actions.push("Confirm the citation")
  if (!licenseConfirmed(record)) actions.push("Confirm the license terms")
  if (!doiConfirmed(record) && !doiNotAvailable(record)) actions.push("Verify whether a DOI exists")
  return actions.length ? actions : ["Resolve ambiguity against the exact source record"]
}

// Basic structural validation (never fabricates; only flags inconsistent records).
export function validateSourceCurationRecord(record = {}) {
  const errors = []
  if (!hasValue(record.recordId)) errors.push("recordId is required")
  if (String(record.sourceStatus || "").toLowerCase() === "confirmed" && !hasValue(record.sourceUrl) && !hasValue(record.citation)) {
    errors.push("sourceStatus=confirmed requires a sourceUrl or a citation")
  }
  if (String(record.doiStatus || "").toLowerCase() === "confirmed" && !hasValue(record.doi)) {
    errors.push("doiStatus=confirmed requires a doi value")
  }
  if (String(record.licenseStatus || "").toLowerCase() === "confirmed" && !hasValue(record.license)) {
    errors.push("licenseStatus=confirmed requires a license value")
  }
  return { valid: errors.length === 0, errors }
}

function countInto(counts, key) {
  counts[key] = (counts[key] || 0) + 1
}

export function buildSourceCurationSummary(records = []) {
  const rows = (Array.isArray(records) ? records : []).map(normalizeManualSourceCuration)
  const summary = {
    checkedCandidates: rows.length,
    sourceConfirmedCount: 0,
    citationReadyCount: 0,
    licenseConfirmedCount: 0,
    licensePendingCount: 0,
    licenseUnknownCount: 0,
    doiConfirmedCount: 0,
    doiNotAvailableCount: 0,
    doiPendingCount: 0,
    descriptorProvenanceCompleteCount: 0,
    ambiguityWarningCount: 0,
    verifiedMetadataEligibleCount: 0,
    verifiedMetadataCount: 0,
    remainingBlockers: {},
    notFinalRecommendation: true,
  }
  for (const row of rows) {
    if (sourceConfirmed(row)) summary.sourceConfirmedCount += 1
    if (citationReady(row)) summary.citationReadyCount += 1
    if (licenseConfirmed(row)) summary.licenseConfirmedCount += 1
    else if (String(row.licenseStatus).toLowerCase() === "unknown") summary.licenseUnknownCount += 1
    else summary.licensePendingCount += 1
    if (doiConfirmed(row)) summary.doiConfirmedCount += 1
    else if (doiNotAvailable(row)) summary.doiNotAvailableCount += 1
    else summary.doiPendingCount += 1
    if (provenanceComplete(row)) summary.descriptorProvenanceCompleteCount += 1
    if (row.ambiguityWarnings.length) summary.ambiguityWarningCount += 1
    if (row.verifiedMetadataEligible) { summary.verifiedMetadataEligibleCount += 1; summary.verifiedMetadataCount += 1 }
    for (const blocker of row.remainingBlockers) countInto(summary.remainingBlockers, blocker)
  }
  return summary
}

// Overlay manual source curation onto the V2.0-K evidence backfill records.
export function mergeSourceCurationIntoEvidenceBackfill(backfillRecords = [], sourceCurationRecords = []) {
  const curationById = new Map((sourceCurationRecords || []).map(record => [record.recordId, normalizeManualSourceCuration(record)]))
  return (backfillRecords || []).map(backfill => {
    const curation = curationById.get(backfill.recordId)
    if (!curation) return { ...normalizeEvidenceBackfillRecord(backfill), ambiguityWarnings: [], manualSourceCurated: false }
    const raw = {
      ...backfill,
      sourceUrl: curation.sourceUrl ?? backfill.sourceUrl ?? null,
      sourceStatus: curation.sourceStatus,
      sourceEvidenceNote: curation.sourceEvidenceNote,
      citation: curation.citation ?? backfill.citation ?? null,
      citationStatus: curation.citationStatus,
      citationEvidenceNote: curation.citationEvidenceNote,
      license: curation.license ?? backfill.license ?? null,
      licenseStatus: curation.licenseStatus,
      licenseEvidenceNote: curation.licenseEvidenceNote,
      doi: curation.doi ?? backfill.doi ?? null,
      doiStatus: curation.doiStatus,
      doiEvidenceNote: curation.doiEvidenceNote,
      descriptorProvenanceStatus: curation.descriptorProvenanceStatus || backfill.descriptorProvenanceStatus,
    }
    const normalized = normalizeEvidenceBackfillRecord(raw)
    const ambiguity = curation.ambiguityWarnings
    // Use the V2.0-L source-curation readiness (which accepts doiStatus="not_available"
    // when source/citation/license/provenance are confirmed and there is no ambiguity).
    // An unresolved ambiguity warning always blocks verified eligibility.
    const eligible = curation.verifiedMetadataEligible && ambiguity.length === 0
    return {
      ...normalized,
      ambiguityWarnings: ambiguity,
      curationConfidence: curation.curationConfidence,
      manualSourceCurated: true,
      verifiedMetadataEligible: eligible,
      verifiedMetadataReason: curation.verifiedMetadataReason,
    }
  })
}

const STATUS_COPY = {
  confirmed: { en: "confirmed", zh: "已确认" },
  ready: { en: "ready", zh: "可用" },
  pending: { en: "pending", zh: "待补" },
  unknown: { en: "unknown", zh: "待补" },
  not_available: { en: "not available", zh: "不适用" },
  searched: { en: "searched", zh: "已检索" },
  complete: { en: "complete", zh: "完整" },
  partial: { en: "partial", zh: "部分" },
}

export function sourceCurationStatusLabel(value, lang) {
  const row = STATUS_COPY[String(value || "").toLowerCase()]
  if (!row) return lang === "zh" ? "待补" : "pending"
  return lang === "zh" ? row.zh : row.en
}
