// @ts-nocheck
// V3.4 Train/Validation/Test Split Builder (V2) — builds a leakage-free
// 70 / 15 / 15 split and keeps an explicit external_test split separate.
//
// The grouping is the key upgrade over V1: records that share the SAME catalyst,
// the SAME experiment, or the SAME publication DOI are union-find merged into a
// single group, and a whole group is assigned to exactly one split. This makes
// it structurally impossible for the same DOI / experiment / catalyst to cross
// train / validation / test.
const RATIOS = { train: 0.7, validation: 0.15, test: 0.15 }
const norm = value => (value == null || value === "" ? null : String(value).trim().toLowerCase())

function catalystKey(r) { return norm(r.catalystId || r.candidateId || r.mofId || r.mof?.mofId) }
function doiKey(r) { return norm(r.sourceDoi || r.doi || r.evidence?.doi) }
function experimentKey(r) { return norm(r.experimentId || `${r.candidateId || r.catalystId}:${r.temperature}:${r.pressure}:${r.solvent}:${r.reactionTime}`) }

class UnionFind {
  constructor() { this.parent = new Map() }
  find(x) {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let root = x
    while (this.parent.get(root) !== root) root = this.parent.get(root)
    while (this.parent.get(x) !== root) { const next = this.parent.get(x); this.parent.set(x, root); x = next }
    return root
  }
  union(a, b) { this.parent.set(this.find(a), this.find(b)) }
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

function hasLabel(r) {
  return r.groundTruthClass != null || r.groundTruthValue != null || r.binaryLabel != null || r.groundTruthLabel != null || ["train", "validation", "test", "external_test"].includes(norm(r.split))
}

export function buildBenchmarkSplitV2({ records = [], externalTest = [], seed = 7 } = {}) {
  const eligible = records.filter(hasLabel)

  // External test is supplied separately and never enters the train pool.
  const external = (externalTest || []).map(r => ({ ...r, split: "external_test", externalTest: true }))

  // Union-find merge by catalyst / experiment / doi.
  const uf = new UnionFind()
  for (const r of eligible) {
    const rid = `rec:${r.recordId || r.labelId}`
    uf.find(rid)
    for (const [prefix, key] of [["cat", catalystKey(r)], ["exp", experimentKey(r)], ["doi", doiKey(r)]]) {
      if (key) uf.union(rid, `${prefix}:${key}`)
    }
  }
  const groupOf = r => uf.find(`rec:${r.recordId || r.labelId}`)

  const groups = [...new Set(eligible.map(groupOf))]
  const order = seededOrder(groups.length, seed).map(i => groups[i])
  const trainCut = Math.round(order.length * RATIOS.train)
  const valCut = trainCut + Math.round(order.length * RATIOS.validation)
  const assignment = {}
  order.forEach((g, i) => { assignment[g] = i < trainCut ? "train" : i < valCut ? "validation" : "test" })

  const assigned = eligible.map(r => ({ ...r, split: assignment[groupOf(r)] }))
  const all = [...assigned, ...external]

  const counts = all.reduce((acc, r) => { acc[r.split] = (acc[r.split] || 0) + 1; return acc }, { train: 0, validation: 0, test: 0, external_test: 0 })
  const total = assigned.length || 1
  return {
    records: all,
    trainRecords: assigned.filter(r => r.split === "train"),
    validationRecords: assigned.filter(r => r.split === "validation"),
    testRecords: assigned.filter(r => r.split === "test"),
    externalTestRecords: external,
    counts,
    ratios: {
      train: Number((counts.train / total).toFixed(3)),
      validation: Number((counts.validation / total).toFixed(3)),
      test: Number((counts.test / total).toFixed(3)),
    },
    groupCount: groups.length,
    complete: counts.train > 0 && counts.validation > 0 && counts.test > 0,
  }
}

export default buildBenchmarkSplitV2
