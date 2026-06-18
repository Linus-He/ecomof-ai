// @ts-nocheck
// Guards the benchmark dataset against the three leakage patterns the V3.0
// program forbids:
//   1. Algorithm outputs used as ground truth.
//   2. External-test records leaking into the training split.
//   3. The same publication (DOI) appearing in both train and test.
const FORBIDDEN_LABEL_SOURCES = ["finalScore", "recommendationClass", "algorithmGeneratedScore"]

export function dataLeakageCheck({ records = [] } = {}) {
  const leaks = []

  // 1. Algorithm-generated score used as label.
  for (const record of records) {
    const labelSource = String(record.labelSource || record.label?.source || "").toLowerCase()
    const hit = FORBIDDEN_LABEL_SOURCES.find(field => labelSource.includes(field.toLowerCase()))
    if (hit) leaks.push({ type: "algorithm_score_as_ground_truth", recordId: record.recordId, field: hit })
  }

  // 2. External-test record placed in the training split.
  for (const record of records) {
    if (record.externalTest && String(record.split || "").toLowerCase() === "train") {
      leaks.push({ type: "external_test_in_training", recordId: record.recordId })
    }
  }

  // 3. Same DOI spanning train and test.
  const doiSplits = new Map()
  for (const record of records) {
    const doi = String(record.evidence?.doi || record.doi || "").trim().toLowerCase()
    const split = String(record.split || "").toLowerCase()
    if (!doi || doi === "pending" || !["train", "test"].includes(split)) continue
    if (!doiSplits.has(doi)) doiSplits.set(doi, new Set())
    doiSplits.get(doi).add(split)
  }
  for (const [doi, splits] of doiSplits.entries()) {
    if (splits.has("train") && splits.has("test")) {
      leaks.push({ type: "doi_cross_split_leak", doi })
    }
  }

  return { ok: leaks.length === 0, leaks }
}
