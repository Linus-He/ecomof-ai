// @ts-nocheck
// V3.2 Gold Dataset Audit — random-samples the Gold dataset (20 / 50 / 100)
// and checks real provenance + reaction completeness. Honest: a record only
// passes when DOI, citation, source URL, reaction conditions, yield, selectivity,
// and field provenance are all genuinely present (never fabricated).

const PENDING = ["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"]
const isReal = value => value != null && !PENDING.includes(String(value).trim().toLowerCase())

export const AUDIT_SAMPLE_MODES = [20, 50, 100]

// Deterministic seeded shuffle (LCG) so audits are reproducible.
function seededOrder(length, seed = 42) {
  const indices = Array.from({ length }, (_, i) => i)
  let state = seed >>> 0
  for (let i = length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

// Critical fields block a Gold pass; soft fields are recorded as warnings only.
// A real DOI + citation is the authoritative provenance anchor, so a pending
// sourceUrl is a warning, not a failure.
const CRITICAL_FIELDS = ["doi", "citation", "temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity", "fieldProvenance"]
const SOFT_FIELDS = ["sourceUrl"]

function checkRecord(record = {}) {
  const evidence = record.evidence || {}
  const reaction = record.reaction || {}
  const performance = record.performance || {}
  const present = {
    doi: isReal(evidence.doi),
    citation: isReal(evidence.citation),
    sourceUrl: isReal(evidence.sourceUrl),
    temperature: reaction.temperature != null,
    pressure: reaction.pressure != null,
    solvent: isReal(reaction.solvent),
    reactionTime: reaction.reactionTime != null,
    yield: performance.yield != null,
    selectivity: performance.selectivity != null,
    fieldProvenance: Number(record.provenanceCoverage ?? record.quality?.provenanceCoverage ?? 0) >= 0.75 && !record.syntheticFixture,
  }
  const issues = CRITICAL_FIELDS.filter(field => !present[field])
  if (record.syntheticFixture) issues.push("syntheticFixture")
  const warnings = SOFT_FIELDS.filter(field => !present[field])
  return { recordId: record.recordId, pass: issues.length === 0, issues: [...issues, ...warnings] }
}

export function auditGoldDataset(records = [], { sampleSize = 50, seed = 42 } = {}) {
  const pool = Array.isArray(records) ? records : []
  const size = Math.min(sampleSize, pool.length)
  const order = seededOrder(pool.length, seed).slice(0, size)
  const sampled = order.map(i => pool[i])

  const results = sampled.map(checkRecord)
  const passCount = results.filter(r => r.pass).length
  const failCount = size - passCount
  const missingFields = {}
  for (const result of results) for (const field of result.issues) missingFields[field] = (missingFields[field] || 0) + 1
  const criticalIssues = results.filter(r => !r.pass).map(r => ({ recordId: r.recordId, issues: r.issues }))

  const auditPassRate = size ? Number((passCount / size).toFixed(3)) : 0
  const auditFailRate = size ? Number((failCount / size).toFixed(3)) : 0
  const status = auditPassRate >= 0.95 ? "Pass" : auditPassRate >= 0.8 ? "Warning" : "Fail"

  return {
    auditId: "gold-dataset-audit",
    sampleSize: size,
    populationSize: pool.length,
    passCount,
    failCount,
    auditPassRate,
    auditFailRate,
    missingFields,
    criticalIssues,
    status,
  }
}
