// @ts-nocheck
import { validateSchema } from "./validateSchema.js"
import { validateUnits } from "./validateUnits.js"
import { validateRanges } from "./validateRanges.js"
import { isDuplicate, validateDuplicates } from "./validateDuplicates.js"
import { validateProvenance } from "./validateProvenance.js"
import { validateEvidence } from "./validateEvidence.js"
import { validateComparability } from "./validateComparability.js"

export {
  validateSchema,
  validateUnits,
  validateRanges,
  validateDuplicates,
  validateProvenance,
  validateEvidence,
  validateComparability,
}

export const QUALITY_TIERS = ["Gold", "Silver", "Bronze", "Rejected"]

// Assign a quality tier from the individual check results.
// Synthetic fixtures are capped at Bronze and can never reach Gold/Silver.
function assignTier({ schema, ranges, duplicate, provenance, evidence, comparability, units, synthetic, hasPerformance }) {
  const blockers = []
  if (!schema.ok) blockers.push(`missing ${schema.missing.join(", ")}`)
  if (!ranges.ok) blockers.push(`range ${ranges.outOfRange.join(", ")}`)
  if (duplicate && duplicate.duplicate) blockers.push("duplicate record")
  if (blockers.length) return { tier: "Rejected", blockers }

  // Gold = real, non-synthetic provenance: a confirmed DOI + citation, strong
  // source-link coverage, and canonical units. Reaction performance may still
  // be pending (and labels stay null) without blocking a real, well-sourced
  // structural record from being Gold.
  const goldEligible = evidence.ok && !synthetic && provenance.coverage >= 0.8 && units.ok
  if (goldEligible) return { tier: "Gold", blockers }

  const silverEligible = !synthetic && (evidence.hasDoi || evidence.verified) && provenance.coverage >= 0.5
  if (silverEligible) return { tier: "Silver", blockers }

  return { tier: "Bronze", blockers }
}

// Validate a single normalized record. Pass a shared `seenKeys` Set to detect duplicates across a dataset.
export function validateRecord(record = {}, { seenKeys = new Set() } = {}) {
  const schema = validateSchema(record)
  const units = validateUnits(record)
  const ranges = validateRanges(record)
  const duplicate = isDuplicate(record, seenKeys)
  const provenance = validateProvenance(record)
  const evidence = validateEvidence(record)
  const comparability = validateComparability(record)
  const synthetic = Boolean(record.syntheticFixture)
  const hasPerformance = comparability.hasPerformance

  const { tier, blockers } = assignTier({ schema, ranges, duplicate, provenance, evidence, comparability, units, synthetic, hasPerformance })
  const warnings = [...(evidence.warnings || []), ...(synthetic ? ["synthetic fixture (capped at Bronze)"] : [])]

  return {
    recordId: record.recordId,
    qualityTier: tier,
    validationStatus: tier,
    checks: { schema, units, ranges, duplicate, provenance, evidence, comparability },
    blockers,
    warnings,
    provenanceCoverage: provenance.coverage,
    synthetic,
  }
}

// Validate a full dataset and attach tiers + a distribution summary.
export function validateDataset(records = []) {
  const seenKeys = new Set()
  const results = records.map(record => {
    const result = validateRecord(record, { seenKeys })
    return { ...record, quality: { ...(record.quality || {}), validationStatus: result.qualityTier, provenanceCoverage: result.provenanceCoverage, warnings: result.warnings, blockers: result.blockers }, qualityTier: result.qualityTier, validation: result }
  })
  const distribution = { Gold: 0, Silver: 0, Bronze: 0, Rejected: 0 }
  for (const row of results) distribution[row.qualityTier] = (distribution[row.qualityTier] || 0) + 1
  const dup = validateDuplicates(records)
  return {
    records: results,
    distribution,
    total: results.length,
    duplicateCount: dup.duplicates.length,
    provenanceCoverage: results.length ? Number((results.reduce((sum, row) => sum + (row.validation.provenanceCoverage || 0), 0) / results.length).toFixed(3)) : 0,
  }
}
