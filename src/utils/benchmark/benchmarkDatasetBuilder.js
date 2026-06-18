// @ts-nocheck
import { calculateBenchmarkEligibility } from "./calculateBenchmarkEligibility.js"
import { dataLeakageCheck } from "./dataLeakageCheck.js"

const FEATURE_FIELDS = [
  ["mof", "surfaceArea"],
  ["mof", "poreVolume"],
  ["mof", "poreSizeA"],
  ["mof", "density"],
  ["mof", "voidFraction"],
  ["mof", "bandGap"],
  ["reaction", "temperature"],
  ["reaction", "pressure"],
  ["reaction", "reactionTime"],
]

function featureVector(record) {
  const vector = {}
  for (const [layer, field] of FEATURE_FIELDS) {
    const value = record[layer]?.[field]
    vector[field] = value == null ? null : Number(value)
  }
  return vector
}

// Build a benchmark-ready dataset from validated records + a labels map.
// Labels are taken only from the provided label framework; algorithm scores are
// never used as ground truth. Splits are assigned only to labelled records.
export function buildBenchmarkDataset({ records = [], labels = {}, taskType = "binary" } = {}) {
  const labelMap = Array.isArray(labels)
    ? Object.fromEntries(labels.map(entry => [entry.recordId, entry]))
    : labels

  let labelledIndex = 0
  const benchmarkRecords = records.map(record => {
    const labelEntry = labelMap[record.recordId] || {}
    const hasLabel = labelEntry.label != null && String(labelEntry.labelStatus || "missing").toLowerCase() !== "missing"
    // Deterministic 70/30 split assigned only to labelled, non-synthetic records.
    let split = null
    if (hasLabel && !record.syntheticFixture) {
      split = labelledIndex % 10 < 7 ? "train" : "test"
      labelledIndex += 1
    }
    const candidate = {
      recordId: record.recordId,
      candidateId: record.mof?.mofId || record.recordId,
      featureVector: featureVector(record),
      label: hasLabel ? labelEntry.label : null,
      labelStatus: hasLabel ? (labelEntry.labelStatus || "available") : "missing",
      labelSource: labelEntry.labelSource || (hasLabel ? "experimental" : "missing"),
      taskType: labelEntry.taskType || taskType,
      split,
      qualityTier: record.qualityTier || record.quality?.validationStatus || "Bronze",
      syntheticFixture: Boolean(record.syntheticFixture),
      evidence: { doi: record.evidence?.doi || "pending" },
      mof: { mofId: record.mof?.mofId, metalNode: record.mof?.metalNode },
      reaction: { reactionId: record.reaction?.reactionId, targetProduct: record.reaction?.targetProduct },
      provenanceCoverage: record.provenanceCoverage ?? record.quality?.provenanceCoverage ?? 0,
    }
    const eligibility = calculateBenchmarkEligibility(candidate)
    candidate.benchmarkEligible = eligibility.eligible
    candidate.benchmarkEligibilityReasons = eligibility.reasons
    return candidate
  })

  const leakage = dataLeakageCheck({ records: benchmarkRecords })
  const labelCount = benchmarkRecords.filter(row => row.label != null && row.labelStatus !== "missing").length
  const benchmarkEligibleCount = benchmarkRecords.filter(row => row.benchmarkEligible === "Ready").length
  const trainCount = benchmarkRecords.filter(row => row.split === "train").length
  const testCount = benchmarkRecords.filter(row => row.split === "test").length

  return {
    records: benchmarkRecords,
    summary: {
      total: benchmarkRecords.length,
      labelCount,
      benchmarkEligibleCount,
      trainCount,
      testCount,
      leakageOk: leakage.ok,
      leaks: leakage.leaks,
    },
  }
}
