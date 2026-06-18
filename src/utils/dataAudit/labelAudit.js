// @ts-nocheck
// V3.2 Label Audit — classifies every label by its real source and refuses to
// let an algorithm-generated label count as ground truth. Honest about how many
// labels are truly experimental vs dataset-derived vs literature vs expert.

function classifySource(source = "") {
  const s = String(source).toLowerCase()
  if (/algorithm|final.?score|recommendation|model.?score|predicted/.test(s)) return "algorithm_generated"
  if (/experiment|measured|measurement|lab|assay/.test(s)) return "experimental"
  if (/expert|manual.?review|curator.?review/.test(s)) return "expert_review"
  if (/literature|paper|publication|article/.test(s)) return "literature"
  if (/reaction_dataset|performance_field|dataset|derived|curated/.test(s)) return "dataset_derived"
  return "other"
}

function hasLabel(entry = {}) {
  if (String(entry.labelStatus || "missing").toLowerCase() === "missing") return false
  return entry.label != null || entry.binaryLabel != null || entry.groundTruthLabel != null || entry.multiClassLabel != null || entry.regression != null
}

export function auditLabels(labels = []) {
  const rows = Array.isArray(labels) ? labels : Array.isArray(labels?.labels) ? labels.labels : []
  const labelled = rows.filter(hasLabel)

  const labelSourceDistribution = { experimental: 0, literature: 0, expert_review: 0, dataset_derived: 0, algorithm_generated: 0, other: 0 }
  for (const entry of labelled) {
    const category = classifySource(entry.labelSource || entry.groundTruthSource || entry.source)
    labelSourceDistribution[category] += 1
  }

  const realExperimentalLabelCount = labelSourceDistribution.experimental
  const literatureLabelCount = labelSourceDistribution.literature
  const expertReviewLabelCount = labelSourceDistribution.expert_review
  const datasetDerivedCount = labelSourceDistribution.dataset_derived
  const algorithmGeneratedCount = labelSourceDistribution.algorithm_generated
  // An algorithm-generated label used as ground truth is invalid and forbidden.
  const invalidGroundTruthCount = algorithmGeneratedCount

  let status
  if (invalidGroundTruthCount > 0) status = "Fail"
  else if (realExperimentalLabelCount === 0) status = "Warning"
  else status = "Pass"

  return {
    auditId: "label-audit",
    total: labelled.length,
    labelSourceDistribution,
    realExperimentalLabelCount,
    literatureLabelCount,
    expertReviewLabelCount,
    datasetDerivedCount,
    algorithmGeneratedCount,
    invalidGroundTruthCount,
    status,
    note: realExperimentalLabelCount === 0
      ? "Labels exist and are not algorithm-generated, but none are independently-measured experimental labels yet (dataset-derived). Accuracy / ROC stay Pending until real experimental labels are available."
      : "Real experimental labels present.",
  }
}
