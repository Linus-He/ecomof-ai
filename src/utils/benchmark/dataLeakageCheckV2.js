// @ts-nocheck

function key(value) {
  if (value == null || value === "") return null
  return String(value).trim().toLowerCase()
}

function addIndex(map, name, value, split, recordId) {
  const normalized = key(value)
  if (!normalized || !split) return
  const bucketKey = `${name}:${normalized}`
  if (!map.has(bucketKey)) map.set(bucketKey, { name, value: normalized, splits: new Map() })
  const bucket = map.get(bucketKey)
  if (!bucket.splits.has(split)) bucket.splits.set(split, [])
  bucket.splits.get(split).push(recordId)
}

function catalystKey(record = {}) {
  return record.catalystId || record.candidateId || record.mof?.mofId || record.mofName || record.reaction?.mofName
}

function experimentKey(record = {}) {
  return record.experimentId || `${record.reaction?.reactionId || record.recordId}:${record.reaction?.temperature}:${record.reaction?.pressure}:${record.reaction?.solvent}:${record.reaction?.reactionTime}`
}

export function dataLeakageCheckV2({ records = [] } = {}) {
  const index = new Map()
  const leaks = []
  const unsafeLabels = []

  for (const record of records) {
    const split = key(record.split)
    if (!["train", "test", "external_test"].includes(split)) continue
    const recordId = record.recordId || record.reaction?.reactionId || "record"
    addIndex(index, "doi", record.evidence?.doi || record.doi, split, recordId)
    addIndex(index, "reaction", record.reaction?.reactionId || record.reactionId, split, recordId)
    addIndex(index, "catalyst", catalystKey(record), split, recordId)
    addIndex(index, "experiment", experimentKey(record), split, recordId)
    if (/algorithm|score/i.test(String(record.labelSource || record.groundTruthSource || ""))) {
      unsafeLabels.push({ recordId, labelSource: record.labelSource || record.groundTruthSource })
    }
  }

  for (const item of index.values()) {
    const splitNames = [...item.splits.keys()]
    const hasTrain = splitNames.includes("train")
    const hasTest = splitNames.includes("test") || splitNames.includes("external_test")
    if (hasTrain && hasTest) {
      leaks.push({
        type: item.name,
        value: item.value,
        train: item.splits.get("train") || [],
        test: [...(item.splits.get("test") || []), ...(item.splits.get("external_test") || [])],
      })
    }
  }

  return {
    ok: leaks.length === 0 && unsafeLabels.length === 0,
    leaks,
    unsafeLabels,
    checkedRecordCount: records.length,
    rules: ["same DOI", "same Reaction", "same Catalyst", "same Experiment", "algorithm score labels"],
  }
}

export default dataLeakageCheckV2
