// @ts-nocheck
// V3.2 Data Leakage Check — checks whether the same catalyst / reaction /
// experiment (and publication DOI) appears in more than one split. Catalyst /
// reaction / experiment crossings are real leaks (high severity). A shared
// dataset-level DOI across splits is reported as a warning, not a hard leak,
// because a dataset citation is not an experiment identifier.
const key = value => (value == null || value === "" ? null : String(value).trim().toLowerCase())
const SPLIT_GROUP = split => (["test", "external_test"].includes(split) ? "test" : split)

function catalystKey(record = {}) {
  return record.catalystId || record.candidateId || record.mof?.mofId || record.mofName || record.reaction?.mofName
}
function experimentKey(record = {}) {
  const r = record.reaction || record
  return record.experimentId || `${record.reactionId || r.reactionId || record.recordId}:${record.featureVector?.temperature ?? r.temperature}:${record.featureVector?.pressure ?? r.pressure}:${r.solvent}:${record.featureVector?.reactionTime ?? r.reactionTime}`
}

const SEVERITY = { catalyst: "high", experiment: "high", reaction: "medium", doi: "low" }

export function dataLeakageCheckV3({ records = [] } = {}) {
  const index = new Map()
  const add = (name, value, split, recordId) => {
    const norm = key(value)
    if (!norm || !split) return
    const bucketKey = `${name}:${norm}`
    if (!index.has(bucketKey)) index.set(bucketKey, { name, value: norm, splits: new Set(), records: [] })
    const bucket = index.get(bucketKey)
    bucket.splits.add(SPLIT_GROUP(split))
    bucket.records.push(recordId)
  }

  let splitRecordCount = 0
  for (const record of records) {
    const split = key(record.split)
    if (!["train", "validation", "test", "external_test"].includes(split)) continue
    splitRecordCount += 1
    const recordId = record.recordId || record.reaction?.reactionId || "record"
    add("doi", record.evidence?.doi || record.doi, split, recordId)
    add("reaction", record.reaction?.reactionId || record.reactionId, split, recordId)
    add("catalyst", catalystKey(record), split, recordId)
    add("experiment", experimentKey(record), split, recordId)
  }

  const leakRecords = []
  const sharedDoiWarnings = []
  for (const bucket of index.values()) {
    if (bucket.splits.size <= 1) continue
    const entry = { type: bucket.name, value: bucket.value, severity: SEVERITY[bucket.name] || "medium", records: [...new Set(bucket.records)] }
    if (bucket.name === "doi") sharedDoiWarnings.push(entry)
    else leakRecords.push(entry)
  }

  // Algorithm-generated labels are never valid ground truth.
  const unsafeLabels = records
    .filter(r => /algorithm|final.?score|recommendation|model.?score/i.test(String(r.labelSource || r.groundTruthSource || "")))
    .map(r => ({ recordId: r.recordId, labelSource: r.labelSource || r.groundTruthSource }))

  const leakCount = leakRecords.length
  const leakSeverity = leakRecords.some(l => l.severity === "high") ? "high" : leakRecords.some(l => l.severity === "medium") ? "medium" : leakCount ? "low" : "none"
  return {
    ok: leakCount === 0 && unsafeLabels.length === 0,
    leakCount,
    leakRecords,
    leakSeverity,
    sharedDoiWarnings,
    unsafeLabels,
    checkedRecordCount: splitRecordCount,
    rules: ["same Catalyst", "same Reaction", "same Experiment", "same DOI (warning)", "algorithm score labels"],
  }
}

export default dataLeakageCheckV3
