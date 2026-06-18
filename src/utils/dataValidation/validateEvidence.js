// @ts-nocheck
const PENDING = new Set(["pending", "unknown", "ambiguous", "restricted", "missing", "not_available", "", "null"])

function isReal(value) {
  if (value == null) return false
  return !PENDING.has(String(value).trim().toLowerCase())
}

// Confirms a real (non-fabricated, non-pending) DOI and citation exist.
export function validateEvidence(record = {}) {
  const evidence = record.evidence || {}
  const hasDoi = isReal(evidence.doi)
  const hasCitation = isReal(evidence.citation)
  const hasSourceUrl = isReal(evidence.sourceUrl)
  const verified = Boolean(evidence.verifiedMetadata)
  const warnings = []
  if (!hasDoi) warnings.push("doi pending")
  if (!hasCitation) warnings.push("citation pending")
  return {
    check: "evidence",
    ok: hasDoi && hasCitation,
    hasDoi,
    hasCitation,
    hasSourceUrl,
    verified,
    warnings,
  }
}
