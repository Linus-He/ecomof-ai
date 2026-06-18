// @ts-nocheck
// V3.2 Reaction Dataset Audit — measures cross-record comparability by checking
// the conditions and outcomes that must align for a fair benchmark.
const PENDING = ["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"]
const isReal = value => value != null && !PENDING.includes(String(value).trim().toLowerCase())

const COMPARABILITY_FIELDS = ["temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity"]

function presentFields(record = {}) {
  const reaction = record.reaction || record
  const performance = record.performance || record
  const source = { ...reaction, ...performance }
  return COMPARABILITY_FIELDS.filter(field => {
    const value = source[field]
    if (field === "solvent") return isReal(value)
    return value != null
  })
}

export function auditReactionDataset(records = []) {
  const rows = Array.isArray(records) ? records : Array.isArray(records?.records) ? records.records : []
  const comparabilityDistribution = { Comparable: 0, PartiallyComparable: 0, NotComparable: 0 }
  for (const record of rows) {
    const present = presentFields(record).length
    if (present >= COMPARABILITY_FIELDS.length) comparabilityDistribution.Comparable += 1
    else if (present >= 3) comparabilityDistribution.PartiallyComparable += 1
    else comparabilityDistribution.NotComparable += 1
  }
  const total = rows.length
  const comparableRate = total ? comparabilityDistribution.Comparable / total : 0
  const status = comparableRate >= 0.9 ? "Pass" : comparableRate >= 0.6 ? "Warning" : "Fail"
  return {
    auditId: "reaction-dataset-audit",
    total,
    comparabilityDistribution,
    comparableRate: Number(comparableRate.toFixed(3)),
    status,
  }
}
