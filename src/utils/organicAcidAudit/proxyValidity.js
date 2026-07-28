import {
  ORGANIC_ACID_SCORING_SPEC,
  assignFamily,
  asArray,
  datasetRecords,
  median,
  roundScore,
  safeNumber,
} from "../organicAcidDataDerivation/shared.js"

// Structural descriptors that have real family-level medians in the active
// CoRE MOF 2024 CSD-modified CR source.
const STRUCTURAL_DESCRIPTORS = ["surfaceArea", "poreVolume", "voidFraction", "density", "bandGap"]
// Route-level HGCPS factors that have no family-level structural proxy to
// correlate against; reported honestly as insufficient-n rather than faked.
const NON_FAMILY_FACTORS = [
  { descriptor: "guestActivityCompensation", reason: "route-level factor derived from guest-metal scores; no per-family structural median exists to correlate." },
  { descriptor: "hostGuestComplementarity", reason: "route-level pairing factor; no per-family structural median exists to correlate." },
  { descriptor: "riskRetention", reason: "0-1 risk-retention coefficient from evidence/risk records; no per-family structural median exists to correlate." },
]
const POWER_CAVEAT = "indicative, not confirmatory (family-level n is small; one family can flip the sign)"

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
  const conversion = safeNumber(record.conversion ?? record.performance?.conversion, NaN)
  const values = [yieldValue, selectivity, conversion].filter(Number.isFinite)
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
  const structuralDescriptors = STRUCTURAL_DESCRIPTORS.map(descriptor => {
    const eligible = rows.filter(row => Number.isFinite(row.descriptorMedians[descriptor]) && Number.isFinite(row.reactionPerformanceMedian))
    const rho = eligible.length < 3 ? null : spearmanCorrelation(
      eligible.map(row => row.descriptorMedians[descriptor]),
      eligible.map(row => row.reactionPerformanceMedian),
    )
    const validity = eligible.length < 3
      ? "insufficient-n"
      : rho === null || rho <= 0.1 ? "low-validity-for-this-reaction" : "positive-tracking-signal"
    return {
      descriptor,
      sampleSize: eligible.length,
      n: eligible.length,
      spearmanRho: rho === null ? null : roundScore(rho, 4),
      validity,
      indicative: true,
      powerCaveat: POWER_CAVEAT,
      interpretation: validity === "insufficient-n"
        ? `Only ${eligible.length} families have both a descriptor median and reaction performance; too few to compute a Spearman correlation.`
        : validity === "low-validity-for-this-reaction"
          ? "Indicative only: the family-level structural proxy does not show a reliable positive rank relationship with median reaction performance."
          : "Indicative only: the family-level structural proxy shows a positive rank relationship with median reaction performance.",
    }
  })
  // Route-level HGCPS factors that cannot be correlated at family level — reported honestly.
  const nonFamilyDescriptors = NON_FAMILY_FACTORS.map(({ descriptor, reason }) => ({
    descriptor,
    sampleSize: 0,
    n: 0,
    spearmanRho: null,
    validity: "insufficient-n",
    indicative: true,
    powerCaveat: POWER_CAVEAT,
    interpretation: reason,
  }))
  const descriptors = [...structuralDescriptors, ...nonFamilyDescriptors]
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

  const familyCount = rows.filter(row => Number.isFinite(row.reactionPerformanceMedian)).length
  return {
    auditId: "organic-acid-proxy-validity-v3.10.0",
    method: "family-level Spearman rank correlation between CoRE MOF 2024 CSD-modified CR structural medians and reaction-dataset median yield/selectivity/conversion",
    statisticalPowerNote: `Family-level n is ${familyCount} (~6-8). Spearman power is very low at this n; all results are indicative, not confirmatory, and a single family can flip a correlation. Do not read these as proof or disproof of a descriptor.`,
    descriptorCount: descriptors.length,
    descriptors,
    composite: {
      descriptor: "median(surfaceArea, poreVolume, voidFraction, density, bandGap family medians)",
      sampleSize: eligibleComposite.length,
      n: eligibleComposite.length,
      spearmanRho: compositeRho === null ? null : roundScore(compositeRho, 4),
      validity: compositeValidity,
      indicative: true,
      powerCaveat: POWER_CAVEAT,
    },
    familyRows: rows,
    lowValidityDescriptors: descriptors.filter(row => row.validity === "low-validity-for-this-reaction").map(row => row.descriptor),
    insufficientNDescriptors: descriptors.filter(row => row.validity === "insufficient-n").map(row => row.descriptor),
    weightChangeApplied: false,
    policy: "Audit only. No scoring weight is changed silently.",
  }
}
