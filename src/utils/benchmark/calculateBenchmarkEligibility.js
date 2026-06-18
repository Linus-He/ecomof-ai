// @ts-nocheck
// Gate that decides whether a record may enter Accuracy / ROC / Cross Validation /
// External Test. Without a real ground-truth label the answer is always "Not Ready".
const CRITICAL_FIELDS = [
  ["mof", "mofId"],
  ["mof", "metalNode"],
  ["reaction", "reactionId"],
  ["reaction", "targetProduct"],
]
const VALID_SPLITS = ["train", "test", "validation"]

function hasGroundTruth(record) {
  const label = record.label
  const status = record.labelStatus
  return label != null && status != null && String(status).toLowerCase() !== "missing"
}

export function calculateBenchmarkEligibility(record = {}) {
  const checks = {
    groundTruthExists: hasGroundTruth(record),
    taskTypeDefined: Boolean(record.taskType) && String(record.taskType).toLowerCase() !== "undefined",
    trainTestSplitDefined: VALID_SPLITS.includes(String(record.split || "").toLowerCase()),
    notSynthetic: !record.syntheticFixture && record.qualityTier !== "Rejected",
    fieldSourcesComplete: Number(record.provenanceCoverage ?? record.quality?.provenanceCoverage ?? 0) >= 0.6,
    criticalFieldsComplete: CRITICAL_FIELDS.every(([layer, field]) => {
      const value = record[layer]?.[field]
      return value != null && value !== "" && String(value).toLowerCase() !== "unknown"
    }),
  }

  const reasons = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
  let eligible
  if (!checks.groundTruthExists || !checks.notSynthetic) {
    eligible = "Not Ready"
  } else if (reasons.length === 0) {
    eligible = "Ready"
  } else {
    eligible = "Partially Ready"
  }

  return { eligible, checks, reasons }
}
