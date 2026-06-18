// @ts-nocheck

const DEFAULT_REFERENCE = {
  product: "formic acid",
  temperature: 170,
  pressure: 30,
  solvent: "water",
  reactionTime: 12,
}

function clamp01(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(1, numeric))
}

function numericSimilarity(value, target, tolerance) {
  const actual = Number(value)
  const expected = Number(target)
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return 0
  return clamp01(1 - Math.abs(actual - expected) / tolerance)
}

function textSimilarity(value, target) {
  if (!value || !target) return 0
  const actual = String(value).toLowerCase()
  const expected = String(target).toLowerCase()
  if (actual === expected) return 1
  if (actual.includes(expected) || expected.includes(actual)) return 0.75
  if (/water|aqueous|h2o/.test(actual) && /water|aqueous|h2o/.test(expected)) return 0.8
  return 0.15
}

export function calculateReactionComparability(record = {}, reference = DEFAULT_REFERENCE) {
  const componentScores = {
    Product: textSimilarity(record.product || record.targetProduct, reference.product),
    Temperature: numericSimilarity(record.temperature, reference.temperature, 80),
    Pressure: numericSimilarity(record.pressure, reference.pressure, 40),
    Solvent: textSimilarity(record.solvent, reference.solvent),
    Time: numericSimilarity(record.reactionTime, reference.reactionTime, 18),
  }
  const missing = Object.entries({
    Product: record.product || record.targetProduct,
    Temperature: record.temperature,
    Pressure: record.pressure,
    Solvent: record.solvent,
    Time: record.reactionTime,
  }).filter(([, value]) => value == null || value === "").map(([field]) => field)
  const score = Number((Object.values(componentScores).reduce((sum, value) => sum + value, 0) / Object.keys(componentScores).length).toFixed(3))
  const status = missing.length >= 3 || score < 0.38
    ? "Not Comparable"
    : score < 0.72
      ? "Partially Comparable"
      : "Comparable"

  return {
    recordId: record.reactionId || record.recordId || "reaction-record",
    status,
    comparabilityStatus: status,
    score,
    componentScores,
    missing,
    reference,
    useCases: ["Organic Acid Algorithm", "Evidence Weighting", "Research Reports"],
  }
}

export default calculateReactionComparability
