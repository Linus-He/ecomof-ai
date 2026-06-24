import {
  ORGANIC_ACID_SCORING_SPEC,
  assignFamily,
  asArray,
  datasetRecords,
  median,
  roundScore,
  safeNumber,
} from "../organicAcidDataDerivation/shared.js"

const STRUCTURAL_DESCRIPTORS = ["surfaceArea", "poreVolume", "voidFraction"]

function averageRanks(values = []) {
  const rows = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const ranks = Array(values.length).fill(0)
  let cursor = 0
  while (cursor < rows.length) {
    let end = cursor + 1
    while (end < rows.length && rows[end].value === rows[cursor].value) end += 1
    const averageRank = (cursor + 1 + end) / 2
    for (let index = cursor; index < end; index += 1) ranks[rows[index].index] = averageRank
    cursor = end
  }
  return ranks
}

export function spearmanCorrelation(x = [], y = []) {
  if (x.length !== y.length || x.length < 3) return null
  const xRanks = averageRanks(x)
  const yRanks = averageRanks(y)
  const xMean = xRanks.reduce((sum, value) => sum + value, 0) / xRanks.length
  const yMean = yRanks.reduce((sum, value) => sum + value, 0) / yRanks.length
  const numerator = xRanks.reduce((sum, value, index) => sum + (value - xMean) * (yRanks[index] - yMean), 0)
  const xVariance = xRanks.reduce((sum, value) => sum + (value - xMean) ** 2, 0)
  const yVariance = yRanks.reduce((sum, value) => sum + (value - yMean) ** 2, 0)
  const denominator = Math.sqrt(xVariance * yVariance)
  return denominator ? numerator / denominator : 0
}

function performanceValue(record = {}) {
  const yieldValue = safeNumber(record.yield ?? record.performance?.yield, NaN)
  const selectivity = safeNumber(record.selectivity ?? record.performance?.selectivity, NaN)
  const values = [yieldValue, selectivity].filter(Number.isFinite)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function familyRows(datasets = {}, families = ORGANIC_ACID_SCORING_SPEC.targetFamilies) {
  const structuralRecords = [
    ...datasetRecords(datasets.coreMofImport),
    ...datasetRecords(datasets.qmofImport),
  ]
  const reactionRecords = datasetRecords(datasets.reactionDataset)
  return asArray(families).map(family => {
    const structure = structuralRecords.filter(record => assignFamily(record) === family)
    const reaction = reactionRecords.filter(record => assignFamily(record) === family)
    const descriptorMedians = Object.fromEntries(STRUCTURAL_DESCRIPTORS.map(key => [key, median(structure.map(record => record[key]))]))
    const reactionPerformanceMedian = median(reaction.map(performanceValue))
    return {
      family,
      structuralRecords: structure.length,
      reactionRecords: reaction.length,
      descriptorMedians,
      reactionPerformanceMedian: roundScore(reactionPerformanceMedian, 4),
      medianYield: roundScore(median(reaction.map(record => record.yield)), 4),
      medianSelectivity: roundScore(median(reaction.map(record => record.selectivity)), 4),
    }
  })
}

export function buildProxyValidityAudit(datasets = {}, options = {}) {
  const rows = familyRows(datasets, options.families)
  const descriptors = STRUCTURAL_DESCRIPTORS.map(descriptor => {
    const eligible = rows.filter(row => Number.isFinite(row.descriptorMedians[descriptor]) && Number.isFinite(row.reactionPerformanceMedian))
    const rho = spearmanCorrelation(
      eligible.map(row => row.descriptorMedians[descriptor]),
      eligible.map(row => row.reactionPerformanceMedian),
    )
    const validity = rho === null || rho <= 0.1 ? "low-validity-for-this-reaction" : "positive-tracking-signal"
    return {
      descriptor,
      sampleSize: eligible.length,
      spearmanRho: rho === null ? null : roundScore(rho, 4),
      validity,
      interpretation: validity === "low-validity-for-this-reaction"
        ? "The family-level structural proxy does not show a reliable positive rank relationship with median reaction yield/selectivity."
        : "The family-level structural proxy shows a positive rank relationship with median reaction yield/selectivity.",
    }
  })
  const eligibleComposite = rows
    .map(row => ({
      ...row,
      composite: median(STRUCTURAL_DESCRIPTORS.map(key => row.descriptorMedians[key])),
    }))
    .filter(row => Number.isFinite(row.composite) && Number.isFinite(row.reactionPerformanceMedian))
  const compositeRho = spearmanCorrelation(
    eligibleComposite.map(row => row.composite),
    eligibleComposite.map(row => row.reactionPerformanceMedian),
  )
  const compositeValidity = compositeRho === null || compositeRho <= 0.1
    ? "low-validity-for-this-reaction"
    : "positive-tracking-signal"

  return {
    auditId: "organic-acid-proxy-validity-v3.9.8",
    method: "family-level Spearman rank correlation between CoRE/QMOF structural medians and reaction-dataset median yield/selectivity",
    descriptors,
    composite: {
      descriptor: "median(surfaceArea, poreVolume, voidFraction family medians)",
      sampleSize: eligibleComposite.length,
      spearmanRho: compositeRho === null ? null : roundScore(compositeRho, 4),
      validity: compositeValidity,
    },
    familyRows: rows,
    lowValidityDescriptors: descriptors.filter(row => row.validity === "low-validity-for-this-reaction").map(row => row.descriptor),
    weightChangeApplied: false,
    policy: "Audit only. No scoring weight is changed silently.",
  }
}
