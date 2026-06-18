// @ts-nocheck
// V3.2 Provenance Audit — measures DOI / citation / source-URL / field-source
// coverage across a dataset and reports a single provenance coverage score.
const PENDING = ["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"]
const isReal = value => value != null && !PENDING.includes(String(value).trim().toLowerCase())

export function auditProvenance(records = []) {
  const rows = Array.isArray(records) ? records : Array.isArray(records?.records) ? records.records : []
  const total = rows.length || 1
  let doiOk = 0
  let citationOk = 0
  let sourceOk = 0
  let fieldSourcesOk = 0
  for (const record of rows) {
    const evidence = record.evidence || record
    if (isReal(evidence.doi)) doiOk += 1
    if (isReal(evidence.citation)) citationOk += 1
    if (isReal(evidence.sourceUrl) || isReal(record.sourceId)) sourceOk += 1
    if (Number(record.provenanceCoverage ?? record.quality?.provenanceCoverage ?? 0) >= 0.75) fieldSourcesOk += 1
  }
  const doiCoverage = Number((doiOk / total).toFixed(3))
  const citationCoverage = Number((citationOk / total).toFixed(3))
  const sourceCoverage = Number((sourceOk / total).toFixed(3))
  const fieldSourcesCoverage = Number((fieldSourcesOk / total).toFixed(3))
  const provenanceCoverageScore = Number(((doiCoverage + citationCoverage + sourceCoverage + fieldSourcesCoverage) / 4).toFixed(3))
  const status = provenanceCoverageScore >= 0.9 ? "Pass" : provenanceCoverageScore >= 0.7 ? "Warning" : "Fail"
  return {
    auditId: "provenance-audit",
    total: rows.length,
    doiCoverage,
    citationCoverage,
    sourceCoverage,
    fieldSourcesCoverage,
    provenanceCoverageScore,
    status,
  }
}
