// @ts-nocheck

function isReal(value) {
  if (value == null) return false
  return !["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous", "null"].includes(String(value).trim().toLowerCase())
}

function hasReactionData(record = {}) {
  const reaction = record.reaction || {}
  return isReal(reaction.reactionId) && isReal(reaction.product || reaction.targetProduct) && isReal(reaction.temperature) && isReal(reaction.pressure) && isReal(reaction.solvent) && isReal(reaction.reactionTime)
}

function hasEvidence(record = {}) {
  const evidence = record.evidence || {}
  return isReal(evidence.doi) && isReal(evidence.citation)
}

function hasGroundTruth(record = {}) {
  if (isReal(record.groundTruthLabel)) return true
  if (Number.isFinite(Number(record.groundTruthValue))) return true
  return false
}

function hasProvenance(record = {}) {
  const fieldSources = record.fieldSources || {}
  const critical = ["reactionId", "product", "temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity", "conversion", "doi", "citation"]
  const covered = critical.filter(field => fieldSources[field] && isReal(fieldSources[field].citation || fieldSources[field].doi || fieldSources[field].sourceRecordId)).length
  const coverage = Number(record.provenanceCoverage ?? (covered / critical.length))
  return coverage >= 0.75
}

function trainTestReady(record = {}) {
  return ["train", "test", "external_test"].includes(String(record.split || "").toLowerCase())
}

export function calculateBenchmarkEligibilityV2(record = {}) {
  const checks = {
    groundTruth: hasGroundTruth(record) && String(record.labelStatus || "").toLowerCase() !== "missing",
    reactionData: hasReactionData(record),
    evidence: hasEvidence(record),
    provenance: hasProvenance(record),
    qualityTier: ["Gold", "Silver"].includes(record.qualityTier || record.validationStatus),
    trainTestSplit: trainTestReady(record),
    notSynthetic: !record.syntheticFixture,
    labelSourceSafe: !/algorithm|score/i.test(String(record.labelSource || record.groundTruthSource || "")),
  }
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
  const status = missing.length === 0
    ? "Ready"
    : missing.length <= 2 && checks.groundTruth && checks.reactionData && checks.evidence
      ? "Partially Ready"
      : "Not Ready"

  return {
    recordId: record.recordId || record.reaction?.reactionId || "benchmark-record",
    status,
    benchmarkEligible: status,
    checks,
    blockers: missing,
    explanation: missing.length ? `${missing.join(", ")} required before benchmark use.` : "Ready for benchmark split without fabricated metrics.",
  }
}

export default calculateBenchmarkEligibilityV2
