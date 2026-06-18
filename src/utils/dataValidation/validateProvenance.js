// @ts-nocheck
const PENDING = new Set(["pending", "unknown", "ambiguous", "restricted", "missing", "not_available", ""])

function isReal(value) {
  if (value == null) return false
  return !PENDING.has(String(value).trim().toLowerCase())
}

// Field-level provenance coverage across MOF + reaction fields and source links.
export function validateProvenance(record = {}) {
  const sources = record.fieldSources || {}
  const fieldKeys = Object.keys(sources)
  const confirmed = fieldKeys.filter(key => sources[key]?.status === "confirmed")
  const fieldCoverage = fieldKeys.length ? confirmed.length / fieldKeys.length : 0

  const evidence = record.evidence || {}
  const provenanceLinks = ["doi", "sourceUrl", "citation"]
  const confirmedLinks = provenanceLinks.filter(link => isReal(evidence[link]))
  const linkCoverage = confirmedLinks.length / provenanceLinks.length

  // "Provenance coverage" reflects source-link provenance (DOI / citation /
  // source URL), which is what determines tier. Field presence is reported
  // separately as fieldCoverage so structural records are not penalized for
  // honestly-missing reaction fields.
  const coverage = Number(linkCoverage.toFixed(3))
  const missingFields = fieldKeys.filter(key => sources[key]?.status !== "confirmed")
  return {
    check: "provenance",
    ok: coverage >= 0.5,
    coverage,
    fieldCoverage: Number(fieldCoverage.toFixed(3)),
    linkCoverage: Number(linkCoverage.toFixed(3)),
    missingFields,
  }
}
