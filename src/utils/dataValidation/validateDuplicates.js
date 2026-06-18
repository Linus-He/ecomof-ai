// @ts-nocheck
// Detects duplicate records by a stable composite key.
function recordKey(record = {}) {
  const mofId = (record.mof?.mofId || record.recordId || "").toLowerCase()
  const reactionId = (record.reaction?.reactionId || "").toLowerCase()
  const doi = (record.evidence?.doi || "").toLowerCase()
  const temp = record.reaction?.temperature ?? ""
  return `${mofId}::${reactionId}::${doi}::${temp}`
}

// Returns duplicate groups across a list of records.
export function validateDuplicates(records = []) {
  const seen = new Map()
  const duplicates = []
  for (const record of records) {
    const key = recordKey(record)
    if (seen.has(key)) {
      duplicates.push({ key, recordId: record.recordId, duplicateOf: seen.get(key) })
    } else {
      seen.set(key, record.recordId)
    }
  }
  return { check: "duplicates", ok: duplicates.length === 0, duplicates, uniqueCount: seen.size }
}

// Single-record check against a set of already-seen keys (used inside the pipeline).
export function isDuplicate(record, seenKeys) {
  const key = recordKey(record)
  const dup = seenKeys.has(key)
  seenKeys.add(key)
  return { check: "duplicates", ok: !dup, key, duplicate: dup }
}
