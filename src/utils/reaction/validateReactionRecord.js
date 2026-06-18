// @ts-nocheck

const PENDING = new Set(["", "pending", "unknown", "ambiguous", "restricted", "missing", "not_available", "null", "undefined"])

const REQUIRED_FIELDS = [
  ["temperature", "Temperature"],
  ["pressure", "Pressure"],
  ["solvent", "Solvent"],
  ["reactionTime", "Reaction Time"],
  ["yield", "Yield"],
  ["selectivity", "Selectivity"],
  ["conversion", "Conversion"],
  ["doi", "DOI"],
  ["citation", "Citation"],
]

const NUMERIC_RANGES = {
  temperature: [-50, 600],
  pressure: [0, 1000],
  reactionTime: [0, 2000],
  yield: [0, 100],
  selectivity: [0, 100],
  conversion: [0, 100],
}

function isReal(value) {
  if (value == null) return false
  return !PENDING.has(String(value).trim().toLowerCase())
}

function asNumber(value) {
  if (value == null || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function hasFieldSource(record, field) {
  const source = record.fieldSources?.[field]
  if (!source) return false
  return isReal(source.sourceDatabase || source.source || source.citation || source.doi || source.sourceRecordId)
}

function qualityTier({ missing, rangeIssues, sourceCoverage, syntheticFixture }) {
  if (syntheticFixture || missing.includes("DOI") || missing.includes("Citation") || missing.includes("Temperature") || missing.includes("Pressure") || missing.includes("Solvent")) {
    return "Rejected"
  }
  if (rangeIssues.length) return "Rejected"
  if (missing.length === 0 && sourceCoverage >= 0.85) return "Gold"
  if (missing.length <= 1 && sourceCoverage >= 0.65) return "Silver"
  return "Bronze"
}

export function validateReactionRecord(record = {}) {
  const missing = []
  const rangeIssues = []
  const checks = {}

  for (const [field, label] of REQUIRED_FIELDS) {
    const present = isReal(record[field])
    checks[field] = { present, fieldSource: hasFieldSource(record, field) }
    if (!present) missing.push(label)
  }

  for (const [field, [min, max]] of Object.entries(NUMERIC_RANGES)) {
    const numeric = asNumber(record[field])
    if (numeric == null) continue
    if (numeric < min || numeric > max) rangeIssues.push(`${field}=${numeric} outside [${min}, ${max}]`)
  }

  const sourcedFields = REQUIRED_FIELDS.filter(([field]) => hasFieldSource(record, field)).length
  const sourceCoverage = Number((sourcedFields / REQUIRED_FIELDS.length).toFixed(3))
  const syntheticFixture = Boolean(record.syntheticFixture || /synthetic fixture/i.test(String(record.validationStatus || "")))
  const tier = qualityTier({ missing, rangeIssues, sourceCoverage, syntheticFixture })
  const blockers = [
    ...missing.map(field => `${field} missing`),
    ...rangeIssues,
    syntheticFixture ? "Synthetic Fixture is not eligible for reaction validation" : null,
  ].filter(Boolean)

  return {
    recordId: record.reactionId || record.recordId || "reaction-record",
    tier,
    validationStatus: tier,
    score: Number((Math.max(0, 1 - missing.length / REQUIRED_FIELDS.length - rangeIssues.length * 0.12) * sourceCoverage).toFixed(3)),
    checks,
    missing,
    blockers,
    sourceCoverage,
    requiredFields: REQUIRED_FIELDS.map(([, label]) => label),
  }
}

export default validateReactionRecord
