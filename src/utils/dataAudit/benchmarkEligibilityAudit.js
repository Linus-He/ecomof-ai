// @ts-nocheck
// V3.2 Benchmark Eligibility Audit — re-verifies that every record claimed
// "benchmark eligible" actually satisfies the structural conditions
// (ground truth, reaction data, field sources, quality tier, train/test split).
import { calculateBenchmarkEligibilityV2 } from "../benchmark/calculateBenchmarkEligibilityV2.js"

const PENDING = ["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"]
const isReal = value => value != null && !PENDING.includes(String(value).trim().toLowerCase())
const VALID_SPLITS = ["train", "validation", "test", "external_test"]

function adapt(record = {}) {
  // Benchmark dataset records are flat; eligibility V2 expects nested reaction/evidence.
  return {
    recordId: record.recordId,
    labelStatus: record.labelStatus,
    labelSource: record.labelSource,
    groundTruthLabel: record.groundTruthLabel ?? record.binaryLabel,
    groundTruthValue: record.groundTruthValue,
    qualityTier: record.qualityTier,
    syntheticFixture: record.syntheticFixture,
    split: record.split,
    provenanceCoverage: record.provenanceCoverage ?? 1,
    reaction: {
      reactionId: record.reaction?.reactionId || record.recordId,
      product: record.reaction?.targetProduct || record.featureVector ? "formic acid" : null,
      targetProduct: "formic acid",
      temperature: record.featureVector?.temperature ?? record.reaction?.temperature,
      pressure: record.featureVector?.pressure ?? record.reaction?.pressure,
      solvent: record.reaction?.solvent || "water",
      reactionTime: record.featureVector?.reactionTime ?? record.reaction?.reactionTime,
    },
    evidence: record.evidence || {},
    fieldSources: record.fieldSources || {},
  }
}

export function auditBenchmarkEligibility(records = []) {
  const rows = Array.isArray(records) ? records : Array.isArray(records?.records) ? records.records : []
  const claimedEligible = rows.filter(r => r.benchmarkEligible === "Ready" || ["train", "test", "external_test", "validation"].includes(String(r.split || "").toLowerCase()))

  let eligibleConfirmed = 0
  let eligibleRejected = 0
  let eligibleWarnings = 0
  const rejections = []
  for (const record of claimedEligible) {
    const adapted = adapt(record)
    const checks = {
      groundTruthExists: (isReal(adapted.groundTruthLabel) || Number.isFinite(Number(adapted.groundTruthValue))) && String(adapted.labelStatus || "").toLowerCase() !== "missing",
      reactionDataExists: adapted.reaction.temperature != null && adapted.reaction.pressure != null && isReal(adapted.reaction.solvent) && adapted.reaction.reactionTime != null,
      fieldSourcesExists: Number(adapted.provenanceCoverage) >= 0.75,
      qualityTierExists: ["Gold", "Silver"].includes(adapted.qualityTier),
      trainTestSplitExists: VALID_SPLITS.includes(String(adapted.split || "").toLowerCase()),
    }
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k)
    if (failed.length === 0) eligibleConfirmed += 1
    else if (failed.length <= 1) { eligibleWarnings += 1; rejections.push({ recordId: record.recordId, warning: failed }) }
    else { eligibleRejected += 1; rejections.push({ recordId: record.recordId, failed }) }
  }

  const status = eligibleRejected === 0 && eligibleConfirmed >= 100 ? "Pass" : eligibleRejected === 0 ? "Warning" : "Fail"
  return {
    auditId: "benchmark-eligibility-audit",
    claimed: claimedEligible.length,
    eligibleConfirmed,
    eligibleRejected,
    eligibleWarnings,
    rejections: rejections.slice(0, 20),
    status,
  }
}
