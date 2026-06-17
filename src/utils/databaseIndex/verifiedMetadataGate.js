// @ts-nocheck
// V2.0-M Verified Metadata Gate.
//
// The strict gate that decides whether a candidate's metadata is verified. It NEVER
// fabricates DOI / license / source / citation; missing or unconfirmed evidence stays
// pending / ambiguous / not_available. verifiedMetadata is true ONLY when every strict
// condition is satisfied. source_confirmed / citation_ready / near_verified are NOT
// verified_metadata. Every output keeps notFinalRecommendation = true.

export const GATE_CONDITIONS = [
  "sourceConfirmed",
  "sourceUrlStatus=confirmed",
  "licenseStatus=confirmed",
  "citationStatus=confirmed",
  "fixtureRecordMappingStatus=confirmed",
  "fieldLevelCriticalProvenanceComplete=true",
  "syntheticFixture=false",
  "ambiguityWarnings.length=0",
  "verificationBlockers.length=0",
]

function arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

// Build the list of blockers that prevent verified metadata for a record.
export function buildVerificationBlockers(record = {}) {
  const blockers = []
  if (record.sourceConfirmed !== true) blockers.push("source not confirmed")
  if (record.sourceUrlStatus !== "confirmed") blockers.push(`sourceUrl ${record.sourceUrlStatus || "pending"}`)
  if (record.licenseStatus !== "confirmed") blockers.push(`license ${record.licenseStatus || "pending"}`)
  if (record.citationStatus !== "confirmed") blockers.push(`citation ${record.citationStatus || "pending"}`)
  if (record.fixtureRecordMappingStatus !== "confirmed") blockers.push(`fixture record mapping ${record.fixtureRecordMappingStatus || "pending"}`)
  if (record.fieldLevelCriticalProvenanceComplete === false) blockers.push("critical field provenance incomplete")
  if (record.isSyntheticFixture === true || record.syntheticFixture === true || String(record.curationStatus || "").includes("synthetic")) blockers.push("synthetic fixture")
  return blockers
}

// The strict verified-metadata gate. Returns true only when all conditions hold.
export function runVerifiedMetadataGate(record = {}) {
  const ambiguity = arr(record.ambiguityWarnings)
  const declaredBlockers = arr(record.verificationBlockers)
  const derivedBlockers = buildVerificationBlockers(record)
  const verificationBlockers = [...new Set([...declaredBlockers, ...derivedBlockers])]
  const eligible =
    record.sourceConfirmed === true &&
    record.sourceUrlStatus === "confirmed" &&
    record.licenseStatus === "confirmed" &&
    record.citationStatus === "confirmed" &&
    record.fixtureRecordMappingStatus === "confirmed" &&
    record.fieldLevelCriticalProvenanceComplete !== false &&
    record.isSyntheticFixture !== true &&
    record.syntheticFixture !== true &&
    !String(record.curationStatus || "").includes("synthetic") &&
    ambiguity.length === 0 &&
    verificationBlockers.length === 0
  return { verifiedMetadata: eligible, verifiedMetadataEligible: eligible, verificationBlockers, ambiguityWarnings: ambiguity }
}

export function normalizeVerificationRecord(record = {}) {
  const gate = runVerifiedMetadataGate(record)
  return {
    candidateId: record.candidateId || record.recordId || "candidate",
    displayName: record.displayName || record.candidateId || "Candidate",
    sourceConfirmed: record.sourceConfirmed === true,
    sourceUrl: record.sourceUrl ?? null,
    sourceUrlStatus: record.sourceUrlStatus || "pending",
    doi: record.doi ?? null,
    doiStatus: record.doiStatus || "pending",
    license: record.license ?? null,
    licenseStatus: record.licenseStatus || "pending",
    exactCitation: record.exactCitation ?? null,
    citationStatus: record.citationStatus || "pending",
    fixtureRecordMappingStatus: record.fixtureRecordMappingStatus || "pending",
    fieldLevelCriticalProvenanceComplete: record.fieldLevelCriticalProvenanceComplete !== false,
    isSyntheticFixture: record.isSyntheticFixture === true || record.syntheticFixture === true,
    ambiguityWarnings: gate.ambiguityWarnings,
    verificationBlockers: gate.verificationBlockers,
    verifiedMetadataEligible: gate.verifiedMetadataEligible,
    verifiedMetadata: gate.verifiedMetadata,
    quarantined: Boolean(record.quarantined) || gate.ambiguityWarnings.length > 0,
    verificationNotes: record.verificationNotes || (gate.verifiedMetadata ? "All strict gate conditions satisfied." : `Blocked: ${gate.verificationBlockers.concat(gate.ambiguityWarnings).join("; ") || "pending"}.`),
    checkedAt: record.checkedAt || "2026-06",
    notFinalRecommendation: true,
  }
}

function countStatus(counts, value) {
  const key = String(value || "pending")
  counts[key] = (counts[key] || 0) + 1
}

export function buildVerifiedMetadataGateSummary(records = []) {
  const rows = (Array.isArray(records) ? records : []).map(normalizeVerificationRecord)
  const sourceUrlStatusCounts = {}
  const licenseStatusCounts = {}
  const citationStatusCounts = {}
  const doiStatusCounts = {}
  const fixtureMappingStatusCounts = {}
  const blockerCounts = {}
  let sourceConfirmedCount = 0
  let citationReadyCount = 0
  let verifiedMetadataCount = 0
  let quarantinedCount = 0

  for (const row of rows) {
    countStatus(sourceUrlStatusCounts, row.sourceUrlStatus)
    countStatus(licenseStatusCounts, row.licenseStatus)
    countStatus(citationStatusCounts, row.citationStatus)
    countStatus(doiStatusCounts, row.doiStatus)
    countStatus(fixtureMappingStatusCounts, row.fixtureRecordMappingStatus)
    if (row.sourceConfirmed) sourceConfirmedCount += 1
    if (["confirmed", "ready"].includes(row.citationStatus)) citationReadyCount += 1
    if (row.verifiedMetadata) verifiedMetadataCount += 1
    if (row.quarantined) quarantinedCount += 1
    for (const blocker of row.verificationBlockers) blockerCounts[blocker] = (blockerCounts[blocker] || 0) + 1
  }

  // Aggregate, human-readable blocking reasons when no candidate reaches verified.
  const blockingReasons = verifiedMetadataCount === 0
    ? Object.entries(blockerCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => `${reason} (${count})`)
    : []

  return {
    checkedCandidates: rows.length,
    sourceConfirmedCount,
    citationReadyCount,
    verifiedMetadataCount,
    quarantinedCount,
    gateConditions: GATE_CONDITIONS,
    sourceUrlStatusCounts,
    licenseStatusCounts,
    citationStatusCounts,
    doiStatusCounts,
    fixtureMappingStatusCounts,
    blockerCounts,
    fieldLevelCriticalProvenanceCondition: "fieldLevelCriticalProvenanceComplete=true",
    syntheticFixtureCondition: "synthetic fixtures cannot be verified metadata",
    blockingReasons,
    verifiedMetadataReached: verifiedMetadataCount >= 1,
    notFinalRecommendation: true,
    boundary: "Strict verified-metadata gate. source_confirmed / citation_ready / near_verified are not verified_metadata. Not full verified database screening and not a final recommendation.",
    boundaryZh: "严格 verified-metadata 门控。source_confirmed / citation_ready / near_verified 都不等于 verified_metadata。不是经完整验证的全量数据库筛选，也不是最终推荐。",
  }
}

export function buildVerifiedCandidateReport(records = [], generatedAt = "2026-06") {
  const rows = (Array.isArray(records) ? records : []).map(normalizeVerificationRecord)
  const verifiedCandidates = rows.filter(row => row.verifiedMetadata).map(row => ({
    candidateId: row.candidateId,
    displayName: row.displayName,
    sourceUrl: row.sourceUrl,
    doi: row.doi,
    license: row.license,
    exactCitation: row.exactCitation,
    verifiedMetadata: true,
    notFinalRecommendation: true,
  }))
  const quarantinedCandidates = rows.filter(row => row.quarantined).map(row => ({
    candidateId: row.candidateId,
    displayName: row.displayName,
    ambiguityWarnings: row.ambiguityWarnings,
    verificationBlockers: row.verificationBlockers,
  }))
  return {
    version: "V2.0-M",
    generatedAt,
    notFinalRecommendation: true,
    verifiedMetadataCount: verifiedCandidates.length,
    reportStatus: verifiedCandidates.length ? "verified_metadata_candidates_available" : "no_verified_candidates_yet",
    verifiedCandidates,
    quarantinedCandidates,
    nearestToVerified: rows
      .filter(row => !row.verifiedMetadata && !row.quarantined)
      .map(row => ({ candidateId: row.candidateId, displayName: row.displayName, verificationBlockers: row.verificationBlockers }))
      .sort((a, b) => a.verificationBlockers.length - b.verificationBlockers.length),
    boundary: "Verified candidate report. Not a final recommendation and not full database screening.",
    boundaryZh: "经核验候选报告；不是最终推荐，也不是全量数据库筛选。",
  }
}

const STATUS_COPY = {
  confirmed: { en: "confirmed", zh: "已确认" },
  pending: { en: "pending", zh: "待补" },
  ambiguous: { en: "ambiguous", zh: "存在歧义" },
  not_available: { en: "not available", zh: "不适用" },
  unknown: { en: "unknown", zh: "待补" },
  restricted: { en: "restricted", zh: "受限" },
  ready: { en: "ready", zh: "可用" },
}

export function verificationStatusLabel(value, lang) {
  const row = STATUS_COPY[String(value || "").toLowerCase()]
  if (!row) return lang === "zh" ? "待补" : "pending"
  return lang === "zh" ? row.zh : row.en
}

export function verificationStatusTone(value) {
  const status = String(value || "").toLowerCase()
  if (status === "confirmed" || status === "ready") return "pass"
  if (status === "ambiguous" || status === "restricted") return "fail"
  if (status === "not_available") return "proxy"
  return "warn"
}
