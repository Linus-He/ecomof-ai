// @ts-nocheck
// V3.4 Ground Truth Verification — verifies that every label used as ground
// truth comes from a Literature / Experimental / Expert-Review source and
// rejects anything Algorithm-Generated. Outputs verified vs invalid counts.
import { isReal } from "../dataIngestion/runImport.js"
import { isExperimentalSource, isForbiddenSource } from "../dataIngestion/experimentalLabelDataset.js"

const norm = value => String(value ?? "").trim().toLowerCase()

const VERIFIED_SOURCES = ["literature", "experimental", "expert_review", "literature_experimental", "independent_validation"]

function hasGroundTruth(label = {}) {
  if (Number.isFinite(Number(label.groundTruthValue))) return true
  return isReal(label.groundTruthClass) || isReal(label.groundTruthLabel) || isReal(label.binaryLabel)
}

export function auditGroundTruth(labels = []) {
  const rows = Array.isArray(labels) ? labels : Array.isArray(labels?.labels) ? labels.labels : []

  let verifiedGroundTruthCount = 0
  let invalidGroundTruthCount = 0
  const invalid = []
  const sourceDistribution = {}

  for (const label of rows) {
    const source = norm(label.sourceType || label.groundTruthSource || label.labelSource)
    sourceDistribution[source || "unknown"] = (sourceDistribution[source || "unknown"] || 0) + 1

    const forbidden = isForbiddenSource(source)
    const verifiedSource = isExperimentalSource(source) || VERIFIED_SOURCES.includes(source)
    const ground = hasGroundTruth(label)

    if (forbidden) {
      invalidGroundTruthCount += 1
      invalid.push({ labelId: label.labelId, reason: `algorithm-generated/derived source "${label.sourceType}" rejected` })
    } else if (verifiedSource && ground) {
      verifiedGroundTruthCount += 1
    } else if (!ground) {
      invalidGroundTruthCount += 1
      invalid.push({ labelId: label.labelId, reason: "no ground-truth value/class" })
    } else {
      invalidGroundTruthCount += 1
      invalid.push({ labelId: label.labelId, reason: `unverifiable source "${label.sourceType}"` })
    }
  }

  // The hard gate: any algorithm-generated label is invalid ground truth.
  const status = invalidGroundTruthCount === 0 && verifiedGroundTruthCount > 0 ? "Pass" : verifiedGroundTruthCount > 0 ? "Warning" : "Fail"

  return {
    auditId: "ground-truth-audit",
    total: rows.length,
    verifiedGroundTruthCount,
    invalidGroundTruthCount,
    sourceDistribution,
    invalid: invalid.slice(0, 20),
    acceptedSources: VERIFIED_SOURCES,
    rejected: "algorithm_generated",
    status,
    note: invalidGroundTruthCount === 0
      ? "All ground truth verified from Literature / Experimental / Expert-Review sources; no algorithm-generated labels."
      : "Some labels failed ground-truth verification (algorithm-generated, derived, or missing value).",
  }
}

export default auditGroundTruth
