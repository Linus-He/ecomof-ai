// @ts-nocheck
// V3.2 Train/Test Split Builder — groups records by catalyst (so the same
// catalyst never crosses splits) and assigns groups to train (70%) /
// validation (15%) / test (15%). Records pre-flagged externalTest are routed to
// an external_test split. Deterministic via a seeded order.
const RATIOS = { train: 0.7, validation: 0.15, test: 0.15 }

function groupKey(record = {}) {
  return String(record.catalystId || record.candidateId || record.mof?.mofId || record.reaction?.reactionId || record.recordId)
}

function seededOrder(length, seed = 7) {
  const indices = Array.from({ length }, (_, i) => i)
  let state = seed >>> 0
  for (let i = length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

export function buildBenchmarkSplit(records = [], { seed = 7 } = {}) {
  const eligible = records.filter(r => r.label != null || r.groundTruthLabel != null || r.binaryLabel != null || ["train", "validation", "test", "external_test"].includes(String(r.split || "").toLowerCase()))

  // Pull out records explicitly destined for external test.
  const externalGroups = new Set()
  for (const record of eligible) {
    if (record.externalTest === true || String(record.split || "").toLowerCase() === "external_test") externalGroups.add(groupKey(record))
  }

  // Group remaining records by catalyst.
  const groupMap = new Map()
  for (const record of eligible) {
    const g = groupKey(record)
    if (externalGroups.has(g)) continue
    if (!groupMap.has(g)) groupMap.set(g, [])
    groupMap.get(g).push(record)
  }

  const groups = [...groupMap.keys()]
  const order = seededOrder(groups.length, seed)
  const orderedGroups = order.map(i => groups[i])
  const trainCut = Math.round(orderedGroups.length * RATIOS.train)
  const valCut = trainCut + Math.round(orderedGroups.length * RATIOS.validation)

  const assignment = {}
  orderedGroups.forEach((g, index) => {
    assignment[g] = index < trainCut ? "train" : index < valCut ? "validation" : "test"
  })

  const assigned = []
  for (const record of eligible) {
    const g = groupKey(record)
    const split = externalGroups.has(g) ? "external_test" : assignment[g]
    assigned.push({ ...record, split })
  }

  const counts = assigned.reduce((acc, r) => { acc[r.split] = (acc[r.split] || 0) + 1; return acc }, { train: 0, validation: 0, test: 0, external_test: 0 })
  const total = assigned.length || 1
  return {
    records: assigned,
    counts,
    ratios: {
      train: Number((counts.train / total).toFixed(3)),
      validation: Number((counts.validation / total).toFixed(3)),
      test: Number((counts.test / total).toFixed(3)),
      external_test: Number((counts.external_test / total).toFixed(3)),
    },
    groupCount: groups.length + externalGroups.size,
    complete: counts.train > 0 && counts.test > 0,
  }
}

export default buildBenchmarkSplit
