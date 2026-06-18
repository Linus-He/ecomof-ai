// @ts-nocheck
// Checks that reaction conditions needed for cross-record comparability are present.
const CONDITION_FIELDS = ["temperature", "pressure", "solvent"]

export function validateComparability(record = {}) {
  const reaction = record.reaction || {}
  const missingConditions = CONDITION_FIELDS.filter(field => reaction[field] == null || reaction[field] === "")
  const hasPerformance = Object.values(record.performance || {}).some(value => value != null)
  return {
    check: "comparability",
    ok: missingConditions.length === 0,
    comparable: missingConditions.length === 0,
    hasPerformance,
    missingConditions,
  }
}
