// @ts-nocheck

export function safeText(value, fallback = "Pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  if (Array.isArray(value)) {
    const rendered = value.map(item => safeText(item, "")).filter(Boolean).join(", ")
    return rendered || fallback
  }
  if (typeof value === "object") return JSON.stringify(value)
  const rendered = String(value)
  if (!rendered || ["undefined", "null", "NaN"].includes(rendered)) return fallback
  return rendered
}

export function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function formatCount(value, fallback = "0") {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? String(numeric) : fallback
}

export function formatPercentValue(value, fallback = "Pending") {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const percent = numeric <= 1 ? numeric * 100 : numeric
  return `${Math.round(percent * 10) / 10}%`
}

export function normalizeTopCandidates(topCandidatesFile = {}) {
  const rows = topCandidatesFile.topCandidates || topCandidatesFile.candidates || []
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    rank: row.rank || index + 1,
    frameworkId: safeText(row.frameworkId || row.id, `candidate-${index + 1}`),
    displayName: safeText(row.displayName || row.name, `Candidate ${index + 1}`),
    oacsPreview: Number.isFinite(Number(row.oacsPreview)) ? Number(row.oacsPreview) : null,
    dataQualityStatus: safeText(row.dataQualityStatus, "pending"),
    evidenceBoundary: safeText(row.evidenceBoundary, "Evidence pending"),
    detailRef: row.detailRef || null,
    notFinalRecommendation: row.notFinalRecommendation !== false,
  }))
}

export function normalizeIndexParts(manifest = {}) {
  const core = manifest.indexParts?.coreMof || manifest.files?.coreMofIndexParts || []
  const qmof = manifest.indexParts?.qmof || manifest.files?.qmofIndexParts || []
  return [
    ...core.map((path, index) => ({ id: `core-${index + 1}`, label: `CoRE part ${index + 1}`, sourceDatabase: "CoRE MOF", path })),
    ...qmof.map((path, index) => ({ id: `qmof-${index + 1}`, label: `QMOF part ${index + 1}`, sourceDatabase: "QMOF", path })),
  ].filter(row => row.path)
}

export function descriptorRows(availability = {}) {
  const rows = availability.descriptorCoverage || availability.rows || []
  return (Array.isArray(rows) ? rows : []).map(row => ({
    descriptor: safeText(row.descriptor || row.field),
    available: safeNumber(row.available ?? row.count),
    percent: safeNumber(row.percent ?? row.coveragePercent),
    interpretation: safeText(row.interpretation || availability.interpretation, "Evidence pending"),
  }))
}

export function provenanceRows(coverage = {}) {
  return [
    ["sourceDatabase coverage", coverage.withSourceDatabase, coverage.totalRecords],
    ["sourceRecordId coverage", coverage.withSourceRecordId, coverage.totalRecords],
    ["sourceDoi coverage", coverage.withSourceDoi, coverage.totalRecords, coverage.doiCoveragePercent],
    ["citation coverage", coverage.withCitation, coverage.totalRecords],
    ["license coverage", coverage.withLicense, coverage.totalRecords],
    ["fieldSources coverage", null, null, coverage.fieldSourceCoveragePercent],
    ["evidenceIds coverage", null, null, coverage.evidenceIdsCoveragePercent],
  ].map(([label, count, total, percent]) => ({
    label,
    count: Number.isFinite(Number(count)) ? Number(count) : null,
    total: Number.isFinite(Number(total)) ? Number(total) : null,
    percent: Number.isFinite(Number(percent)) ? Number(percent) : (Number.isFinite(Number(count)) && Number.isFinite(Number(total)) && Number(total) ? Number(count) / Number(total) * 100 : null),
  }))
}

export function summarizeDatabaseOverview(overview = {}) {
  const core = overview.coreSummary || {}
  const qmof = overview.qmofSummary || {}
  const candidates = normalizeTopCandidates(overview.topCandidates)
  const sourceDatabases = overview.manifest?.sourceDatabases || []
  const detailCount = sourceDatabases.reduce((sum, row) => sum + safeNumber(row.detailCount), 0)
  return {
    datasetMode: safeText(overview.manifest?.datasetMode, "database_index_preview"),
    coreRecords: safeNumber(core.recordCount),
    qmofRecords: safeNumber(qmof.recordCount),
    alContaining: safeNumber(core.alContainingCount),
    readyForScoring: safeNumber(core.readyForScoring),
    needsReview: safeNumber(core.needsReview),
    rejected: safeNumber(core.rejected),
    topCandidateCount: candidates.length,
    detailCount,
    descriptorCoverage: overview.descriptorAvailability?.descriptorCoverage || [],
    provenanceCoverage: overview.provenanceCoverage || {},
  }
}
