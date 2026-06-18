// @ts-nocheck
// V3.3 shared import pipeline: after mapping raw rows into the unified shape,
// every importer runs Validation -> Normalization -> Deduplication ->
// Provenance Check. No new module/algorithm; only ingest + clean + trace.
const PENDING = ["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"]
export const isReal = value => value != null && !PENDING.includes(String(value).trim().toLowerCase())

export const DATASET_ORIGINS = [
  "external_database",
  "literature_curated",
  "experimental",
  "expert_review",
  "derived_dataset",
  "synthetic_fixture",
]

function dedupeKey(record = {}) {
  return `${String(record.sourceDatabase || record.datasetOrigin || "").toLowerCase()}::${String(record.sourceRecordId || record.mofId || record.recordId || "").toLowerCase()}`
}

// Provenance check: a record carries valid provenance when it has a real DOI and
// citation (external database / literature) — synthetic fixtures never do.
function provenanceOk(record = {}) {
  if (record.datasetOrigin === "synthetic_fixture") return false
  return isReal(record.doi) && isReal(record.citation)
}

export function runImport(records = [], { origin } = {}) {
  const validationErrors = []
  const seen = new Set()
  const deduped = []
  let duplicateCount = 0

  for (const record of records) {
    // Validation: dataset origin must be present and known.
    if (!record.datasetOrigin || !DATASET_ORIGINS.includes(record.datasetOrigin)) {
      validationErrors.push({ recordId: record.mofId || record.recordId, error: "invalid datasetOrigin" })
      continue
    }
    if (origin && record.datasetOrigin !== origin) {
      validationErrors.push({ recordId: record.mofId || record.recordId, error: `expected origin ${origin}` })
      continue
    }
    // Deduplication.
    const key = dedupeKey(record)
    if (seen.has(key)) { duplicateCount += 1; continue }
    seen.add(key)
    deduped.push({ ...record, provenanceConfirmed: provenanceOk(record) })
  }

  const provenanceConfirmed = deduped.filter(r => r.provenanceConfirmed).length
  return {
    records: deduped,
    summary: {
      origin: origin || "mixed",
      received: records.length,
      imported: deduped.length,
      duplicateCount,
      validationErrors: validationErrors.length,
      provenanceConfirmed,
      provenanceCoverage: deduped.length ? Number((provenanceConfirmed / deduped.length).toFixed(3)) : 0,
    },
    validationErrors,
  }
}
