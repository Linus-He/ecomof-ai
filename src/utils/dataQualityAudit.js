// V2.2 data quality audit utilities.
// These helpers are intentionally deterministic and offline-only: they score only
// metadata already present in the repository and never invent source evidence.

export const FIELD_QUALITY_SCORE = {
  confirmed: 1,
  normalized: 0.8,
  derived: 0.7,
  pending: 0.4,
  ambiguous: 0.2,
  missing: 0,
  synthetic: 0,
  not_available: 0,
}

export const FIELD_QUALITY_STATUSES = Object.keys(FIELD_QUALITY_SCORE)

export const FIELD_QUALITY_KEYS = [
  "displayName",
  "rawName",
  "sourceDatabase",
  "sourceRecordId",
  "sourceUrl",
  "citation",
  "license",
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
  "evidenceLevel",
  "verifiedMetadataStatus",
]

export const DESCRIPTOR_QUALITY_KEYS = [
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

export const CRITICAL_PROVENANCE_FIELDS = [
  "displayName",
  "sourceDatabase",
  "sourceRecordId",
  "sourceUrl",
  "citation",
  "license",
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "density",
]

const ABSENT_VALUES = new Set(["", "pending", "unknown", "missing", "not_available", "not available", "n/a", "na", "null", "undefined"])

export function hasAuditValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "boolean") return true
  const text = String(value).trim().toLowerCase()
  return !ABSENT_VALUES.has(text)
}

function normalizeStatus(status) {
  const key = String(status || "").trim().toLowerCase()
  return FIELD_QUALITY_STATUSES.includes(key) ? key : null
}

export function computeFieldQualityScore(status) {
  return FIELD_QUALITY_SCORE[normalizeStatus(status) || "pending"] ?? 0
}

function sourceValue(record, key, source = {}) {
  if (hasAuditValue(source.value)) return source.value
  return record?.[key]
}

function hasProvenanceSource(source = {}) {
  return ["sourceDatabase", "sourceRecordId", "sourceUrl", "citation", "license", "retrievedAt", "curationStatus"]
    .every(key => hasAuditValue(source[key]))
}

function inferFieldQualityStatus(record = {}, key, source = {}) {
  const explicit = normalizeStatus(source.fieldQualityStatus || source.status || source.qualityStatus)
  if (explicit) return explicit
  if (record.isSyntheticFixture || record.syntheticFixture || source.syntheticFixture) return "synthetic"
  if (!hasAuditValue(sourceValue(record, key, source))) return "missing"
  if (source.hasAmbiguity || source.ambiguous) return "ambiguous"
  if (source.isNormalizedField || source.normalizationMethod) return "normalized"
  if (source.isDerivedField || source.derivedFrom) return "derived"
  if (String(source.curationStatus || "").toLowerCase().includes("pending")) return "pending"
  return "confirmed"
}

export function normalizeFieldQualitySource(record = {}, key) {
  const source = record.fieldSources?.[key] || {}
  const status = inferFieldQualityStatus(record, key, source)
  const value = sourceValue(record, key, source)
  return {
    value: hasAuditValue(value) ? value : "missing",
    sourceDatabase: source.sourceDatabase || record.sourceDatabase || "pending",
    sourceRecordId: source.sourceRecordId || record.sourceRecordId || "pending",
    sourceUrl: source.sourceUrl || record.sourceUrl || "pending",
    citation: source.citation || record.citation || record.exactCitation || "pending",
    license: source.license || record.license || "pending",
    retrievedAt: source.retrievedAt || record.retrievedAt || "pending",
    curationStatus: source.curationStatus || record.curationStatus || "pending",
    confidence: Number.isFinite(Number(source.confidence)) ? Number(source.confidence) : computeFieldQualityScore(status),
    notes: source.notes || "",
    status,
    fieldQualityStatus: status,
    fieldQualityScore: computeFieldQualityScore(status),
    isOriginalField: source.isOriginalField === true,
    isDerivedField: source.isDerivedField === true || Boolean(source.derivedFrom),
    isManualCuration: source.isManualCuration === true,
    unitConverted: source.unitConverted === true,
    hasAmbiguity: source.hasAmbiguity === true || status === "ambiguous",
    scoringEligible: source.scoringEligible === false ? false : !["missing", "ambiguous", "synthetic", "not_available"].includes(status),
    blocksVerifiedMetadata: source.blocksVerifiedMetadata === true || ["missing", "ambiguous", "synthetic", "pending"].includes(status),
    derivedFrom: source.derivedFrom,
    normalizationMethod: source.normalizationMethod,
    missingReason: source.missingReason || (!hasAuditValue(value) ? "Value not present in current repository data." : undefined),
  }
}

export function buildFieldQualityProfile(record = {}) {
  const fieldSources = {}
  const fieldQualityScores = {}
  const fieldQualityStatuses = {}
  const statusCounts = FIELD_QUALITY_STATUSES.reduce((counts, status) => ({ ...counts, [status]: 0 }), {})
  let scoreTotal = 0
  let provenanceReady = 0
  let descriptorReady = 0

  for (const key of FIELD_QUALITY_KEYS) {
    const source = normalizeFieldQualitySource(record, key)
    fieldSources[key] = source
    fieldQualityScores[key] = source.fieldQualityScore
    fieldQualityStatuses[key] = source.status
    statusCounts[source.status] = (statusCounts[source.status] || 0) + 1
    scoreTotal += source.fieldQualityScore
    if (hasProvenanceSource(source)) provenanceReady += 1
    if (DESCRIPTOR_QUALITY_KEYS.includes(key) && ["confirmed", "normalized", "derived"].includes(source.status)) descriptorReady += 1
  }

  const criticalMissing = CRITICAL_PROVENANCE_FIELDS.filter(key => {
    const source = fieldSources[key]
    return !source || !["confirmed", "normalized", "derived"].includes(source.status) || !hasProvenanceSource(source)
  })
  const ambiguousFields = FIELD_QUALITY_KEYS.filter(key => fieldSources[key]?.status === "ambiguous")
  const missingFields = FIELD_QUALITY_KEYS.filter(key => ["missing", "not_available"].includes(fieldSources[key]?.status))
  const pendingFields = FIELD_QUALITY_KEYS.filter(key => fieldSources[key]?.status === "pending")

  return {
    fieldSources,
    fieldQualityScores,
    fieldQualityStatuses,
    fieldQualityStatusCounts: statusCounts,
    fieldLevelCriticalProvenanceComplete: criticalMissing.length === 0,
    criticalProvenanceMissingFields: criticalMissing,
    ambiguousFields,
    missingFields,
    pendingFields,
    recordQualityScore: FIELD_QUALITY_KEYS.length ? scoreTotal / FIELD_QUALITY_KEYS.length : 0,
    provenanceCompleteness: FIELD_QUALITY_KEYS.length ? provenanceReady / FIELD_QUALITY_KEYS.length : 0,
    descriptorCompleteness: DESCRIPTOR_QUALITY_KEYS.length ? descriptorReady / DESCRIPTOR_QUALITY_KEYS.length : 0,
  }
}

function statusConfirmed(value) {
  return String(value || "").toLowerCase() === "confirmed"
}

function includesDoi(...values) {
  const text = values.filter(Boolean).join(" ")
  return /10\.\d{4,9}\//i.test(text)
}

export function buildQualityVerifiedBlockers(record = {}) {
  const blockers = []
  if (record.sourceConfirmed !== true) blockers.push("source not confirmed")
  if (!statusConfirmed(record.sourceUrlStatus)) blockers.push(`sourceUrl ${record.sourceUrlStatus || "pending"}`)
  if (!statusConfirmed(record.licenseStatus)) blockers.push(`license ${record.licenseStatus || "pending"}`)
  if (!statusConfirmed(record.citationStatus)) blockers.push(`citation ${record.citationStatus || "pending"}`)
  if (!statusConfirmed(record.fixtureRecordMappingStatus)) blockers.push(`fixture record mapping ${record.fixtureRecordMappingStatus || "pending"}`)
  if (record.fieldLevelCriticalProvenanceComplete !== true) blockers.push("critical field provenance incomplete")
  if (record.isSyntheticFixture || record.syntheticFixture || String(record.curationStatus || "").includes("synthetic")) blockers.push("synthetic fixture")
  for (const field of record.ambiguousFields || []) blockers.push(`field ${field} ambiguous`)
  return [...new Set(blockers)]
}

export function enrichRecordQuality(record = {}) {
  const profile = buildFieldQualityProfile(record)
  const ambiguityWarnings = Array.isArray(record.ambiguityWarnings) ? record.ambiguityWarnings.filter(Boolean) : []
  const sourceUrlStatus = record.sourceUrlStatus || (hasAuditValue(record.sourceUrl) ? "confirmed" : "pending")
  const licenseStatus = record.licenseStatus || (hasAuditValue(record.license) ? "confirmed" : "pending")
  const citationStatus = record.citationStatus || (hasAuditValue(record.citation || record.exactCitation) ? "confirmed" : "pending")
  const doiStatus = record.doiStatus || (hasAuditValue(record.doi) || includesDoi(record.citation, record.exactCitation, record.sourceUrl) ? "confirmed" : "pending")
  const fixtureRecordMappingStatus = record.fixtureRecordMappingStatus || (record.isSyntheticFixture ? "synthetic_fixture" : "pending")
  const prelim = {
    ...record,
    ...profile,
    sourceUrlStatus,
    licenseStatus,
    citationStatus,
    doiStatus,
    fixtureRecordMappingStatus,
    ambiguityWarnings,
  }
  const verifiedBlockers = [...new Set([...(Array.isArray(record.verifiedBlockers) ? record.verifiedBlockers : []), ...buildQualityVerifiedBlockers(prelim), ...ambiguityWarnings])]
  const verificationReadiness = (
    profile.recordQualityScore * 0.35 +
    profile.provenanceCompleteness * 0.25 +
    profile.descriptorCompleteness * 0.25 +
    (profile.fieldLevelCriticalProvenanceComplete ? 0.15 : 0)
  )
  const qualityWarnings = [
    ...profile.pendingFields.map(field => `${field}: pending`),
    ...profile.missingFields.map(field => `${field}: missing`),
    ...profile.ambiguousFields.map(field => `${field}: ambiguous`),
    ...(record.isSyntheticFixture ? ["synthetic fixture expansion"] : []),
  ]
  return {
    ...prelim,
    verifiedBlockers,
    verificationBlockers: [...new Set([...(Array.isArray(record.verificationBlockers) ? record.verificationBlockers : []), ...verifiedBlockers])],
    qualityWarnings,
    verificationReadiness,
    highRiskRecord: verifiedBlockers.length > 0 || verificationReadiness < 0.72,
    verifiedMetadataStatus: record.verifiedMetadata ? "verified_metadata" : "not_verified",
  }
}

function countRecordStatus(records, predicate) {
  return records.reduce((count, row) => count + (predicate(row) ? 1 : 0), 0)
}

function average(records, key) {
  if (!records.length) return 0
  return records.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) / records.length
}

export function buildDataQualityAudit(records = [], options = {}) {
  const rows = (Array.isArray(records) ? records : []).map(enrichRecordQuality)
  const fieldCoverage = FIELD_QUALITY_KEYS.map(field => {
    const statusCounts = FIELD_QUALITY_STATUSES.reduce((counts, status) => ({ ...counts, [status]: 0 }), {})
    let provenanceReady = 0
    let scoringEligible = 0
    for (const row of rows) {
      const source = row.fieldSources?.[field] || normalizeFieldQualitySource(row, field)
      statusCounts[source.status] = (statusCounts[source.status] || 0) + 1
      if (hasProvenanceSource(source)) provenanceReady += 1
      if (source.scoringEligible) scoringEligible += 1
    }
    return {
      field,
      total: rows.length,
      confirmed: statusCounts.confirmed || 0,
      pending: statusCounts.pending || 0,
      ambiguous: statusCounts.ambiguous || 0,
      missing: statusCounts.missing || 0,
      derived: statusCounts.derived || 0,
      normalized: statusCounts.normalized || 0,
      synthetic: statusCounts.synthetic || 0,
      not_available: statusCounts.not_available || 0,
      provenanceReady,
      scoringEligible,
      coverageRatio: rows.length ? (statusCounts.confirmed + statusCounts.derived + statusCounts.normalized) / rows.length : 0,
      provenanceRatio: rows.length ? provenanceReady / rows.length : 0,
    }
  })
  const blockerCounts = {}
  const highRiskRecords = []
  for (const row of rows) {
    for (const blocker of row.verificationBlockers || row.verifiedBlockers || []) {
      blockerCounts[blocker] = (blockerCounts[blocker] || 0) + 1
    }
    if (row.highRiskRecord) {
      highRiskRecords.push({
        candidateId: row.candidateId,
        displayName: row.displayName,
        recordQualityScore: row.recordQualityScore,
        verificationReadiness: row.verificationReadiness,
        blockers: row.verificationBlockers || row.verifiedBlockers || [],
      })
    }
  }
  const missingFieldCount = fieldCoverage.reduce((sum, row) => sum + row.missing + row.not_available, 0)
  const ambiguousFieldCount = fieldCoverage.reduce((sum, row) => sum + row.ambiguous, 0)
  const summary = {
    databaseVersion: options.version || "V2.2-Scalable-Database-Preview",
    totalCandidates: rows.length,
    descriptorCoverage: average(rows, "descriptorCompleteness"),
    provenanceCoverage: average(rows, "provenanceCompleteness"),
    sourceConfirmedCount: countRecordStatus(rows, row => row.sourceConfirmed === true),
    citationReadyCount: countRecordStatus(rows, row => ["confirmed", "ready"].includes(String(row.citationStatus || "").toLowerCase())),
    licenseConfirmedCount: countRecordStatus(rows, row => statusConfirmed(row.licenseStatus)),
    doiConfirmedCount: countRecordStatus(rows, row => statusConfirmed(row.doiStatus)),
    sourceUrlConfirmedCount: countRecordStatus(rows, row => statusConfirmed(row.sourceUrlStatus)),
    ambiguityWarningCount: countRecordStatus(rows, row => (row.ambiguityWarnings || []).length > 0 || (row.ambiguousFields || []).length > 0),
    verifiedMetadataCount: countRecordStatus(rows, row => row.verifiedMetadata === true),
    syntheticFixtureCount: countRecordStatus(rows, row => row.isSyntheticFixture || row.syntheticFixture),
    missingFieldCount,
    ambiguousFieldCount,
    highRiskRecordCount: highRiskRecords.length,
    recordQualityScore: average(rows, "recordQualityScore"),
    verificationReadiness: average(rows, "verificationReadiness"),
    notFinalRecommendation: true,
  }
  return {
    runId: options.runId || `data-quality-audit-${new Date().toISOString().slice(0, 10)}`,
    databaseVersion: summary.databaseVersion,
    generatedAt: options.generatedAt || new Date().toISOString(),
    summary,
    fieldCoverage,
    blockerCounts,
    highRiskRecords,
    records: rows,
    notFinalRecommendation: true,
    boundary: "Database Preview quality audit only. Not Verified Screening and not a final recommendation.",
  }
}

export function buildDatabaseHealthSummary(audit = {}) {
  const summary = audit.summary || {}
  const score = (
    (Number(summary.descriptorCoverage) || 0) * 0.25 +
    (Number(summary.provenanceCoverage) || 0) * 0.25 +
    (summary.totalCandidates ? (summary.sourceConfirmedCount || 0) / summary.totalCandidates : 0) * 0.2 +
    (summary.totalCandidates ? (summary.verifiedMetadataCount || 0) / summary.totalCandidates : 0) * 0.15 +
    (summary.totalCandidates ? 1 - Math.min(1, (summary.highRiskRecordCount || 0) / summary.totalCandidates) : 0) * 0.15
  )
  return {
    databaseVersion: audit.databaseVersion || summary.databaseVersion || "V2.2-Scalable-Database-Preview",
    generatedAt: audit.generatedAt,
    candidateCount: summary.totalCandidates || 0,
    healthScore: score,
    healthStatus: score >= 0.75 ? "preview_ready" : score >= 0.5 ? "limited_preview" : "audit_required",
    descriptorCoverage: summary.descriptorCoverage || 0,
    provenanceCoverage: summary.provenanceCoverage || 0,
    verifiedMetadataCount: summary.verifiedMetadataCount || 0,
    sourceConfirmedCount: summary.sourceConfirmedCount || 0,
    highRiskRecordCount: summary.highRiskRecordCount || 0,
    notFinalRecommendation: true,
  }
}

export function buildAuditExportBundle({ records = [], audit, kind = "screening-audit", databaseVersion = "V2.2-Scalable-Database-Preview" } = {}) {
  const resolvedAudit = audit || buildDataQualityAudit(records, { version: databaseVersion })
  return {
    runId: resolvedAudit.runId,
    exportKind: kind,
    databaseVersion: resolvedAudit.databaseVersion || databaseVersion,
    candidateCount: resolvedAudit.summary?.totalCandidates || 0,
    verifiedMetadataCount: resolvedAudit.summary?.verifiedMetadataCount || 0,
    qualityAuditSummary: resolvedAudit.summary,
    fieldCoverage: resolvedAudit.fieldCoverage,
    topCandidates: (resolvedAudit.records || records)
      .slice()
      .sort((a, b) => (Number(b.verificationReadiness) || 0) - (Number(a.verificationReadiness) || 0))
      .slice(0, 10)
      .map(row => ({
        candidateId: row.candidateId,
        displayName: row.displayName,
        recordQualityScore: row.recordQualityScore,
        verificationReadiness: row.verificationReadiness,
        verifiedMetadata: row.verifiedMetadata === true,
      })),
    blockers: resolvedAudit.blockerCounts,
    notFinalRecommendation: true,
  }
}
