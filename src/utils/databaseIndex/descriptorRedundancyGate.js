// @ts-nocheck
// V2.0-G Descriptor Redundancy Gate.
//
// Method analogy only: inspired by the layered filter / Pearson-correlation
// redundancy filtering and multi-view feature engineering discussed in
// Han et al., Nature Communications 2024 (10.1038/s41467-024-52550-9). This gate
// does NOT reproduce that paper's Li-S model, does NOT train any model, and does
// NOT report R^2 / MAE / RMSE.
//
// The gate flags descriptors that may duplicate the same signal (high pairwise
// correlation), carry little information (low variance), or lack enough valid
// samples to judge. It never deletes descriptors and never modifies OACS/DMRS
// formulas. Its output is an auditable explanation / preview adjustment only.

export const DEFAULT_DESCRIPTOR_KEYS = [
  "surfaceArea",
  "poreSizeA",
  "pldA",
  "lcdA",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "stabilityProxy",
  "hydrophilicityProxy",
  "openMetalSiteProxy",
]

const MIN_VALID_SAMPLES = 5

function descriptorValue(record = {}, key) {
  const descriptors = record.descriptors || {}
  const value = record[key] ?? descriptors[key]
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

// Returns { key: [valueOrNull, ...] } aligned across records.
export function getNumericDescriptorMatrix(records = [], descriptorKeys = DEFAULT_DESCRIPTOR_KEYS) {
  const rows = Array.isArray(records) ? records : []
  const matrix = {}
  for (const key of descriptorKeys) {
    matrix[key] = rows.map(record => descriptorValue(record, key))
  }
  return matrix
}

function validValues(series = []) {
  return series.filter(value => value !== null && Number.isFinite(value))
}

function variance(values = []) {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

export function computeVarianceByDescriptor(matrix = {}) {
  const result = {}
  for (const [key, series] of Object.entries(matrix)) {
    const values = validValues(series)
    result[key] = {
      key,
      variance: Math.round(variance(values) * 1e6) / 1e6,
      validCount: values.length,
      missingRate: series.length ? Math.round((1 - values.length / series.length) * 1000) / 1000 : 1,
    }
  }
  return result
}

export function detectLowVarianceDescriptors(matrix = {}, threshold = 1e-6) {
  const stats = computeVarianceByDescriptor(matrix)
  return Object.values(stats)
    .filter(row => row.validCount >= MIN_VALID_SAMPLES && row.variance <= threshold)
    .map(row => row.key)
}

// Pearson correlation over paired, mutually-present values. Returns null when there
// are fewer than MIN_VALID_SAMPLES shared points or zero variance on either side.
export function computePearsonCorrelation(x = [], y = []) {
  const pairs = []
  const length = Math.min(x.length, y.length)
  for (let index = 0; index < length; index += 1) {
    const xv = x[index]
    const yv = y[index]
    if (xv !== null && yv !== null && Number.isFinite(xv) && Number.isFinite(yv)) pairs.push([xv, yv])
  }
  if (pairs.length < MIN_VALID_SAMPLES) return null
  const n = pairs.length
  const meanX = pairs.reduce((sum, [xv]) => sum + xv, 0) / n
  const meanY = pairs.reduce((sum, [, yv]) => sum + yv, 0) / n
  let cov = 0
  let varX = 0
  let varY = 0
  for (const [xv, yv] of pairs) {
    cov += (xv - meanX) * (yv - meanY)
    varX += (xv - meanX) ** 2
    varY += (yv - meanY) ** 2
  }
  if (varX === 0 || varY === 0) return null
  return Math.round((cov / Math.sqrt(varX * varY)) * 1000) / 1000
}

export function computePearsonCorrelationMatrix(matrix = {}) {
  const keys = Object.keys(matrix)
  const result = {}
  for (const a of keys) {
    result[a] = {}
    for (const b of keys) {
      result[a][b] = a === b ? 1 : computePearsonCorrelation(matrix[a], matrix[b])
    }
  }
  return result
}

export function detectRedundantDescriptorPairs(matrix = {}, threshold = 0.7) {
  const keys = Object.keys(matrix)
  const pairs = []
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const a = keys[i]
      const b = keys[j]
      const r = computePearsonCorrelation(matrix[a], matrix[b])
      if (r !== null && Math.abs(r) > threshold) {
        pairs.push({ descriptorA: a, descriptorB: b, pearsonR: r })
      }
    }
  }
  return pairs
}

// Full audit summary. action defaults to penalize / review, never delete.
export function buildDescriptorRedundancySummary(records = [], descriptorKeys = DEFAULT_DESCRIPTOR_KEYS, options = {}) {
  const varianceThreshold = options.varianceThreshold ?? 1e-6
  const correlationThreshold = options.correlationThreshold ?? 0.7
  const matrix = getNumericDescriptorMatrix(records, descriptorKeys)
  const stats = computeVarianceByDescriptor(matrix)
  const redundantPairs = detectRedundantDescriptorPairs(matrix, correlationThreshold)

  const redundantWith = {}
  for (const pair of redundantPairs) {
    redundantWith[pair.descriptorA] = redundantWith[pair.descriptorA] || []
    redundantWith[pair.descriptorB] = redundantWith[pair.descriptorB] || []
    redundantWith[pair.descriptorA].push({ key: pair.descriptorB, pearsonR: pair.pearsonR })
    redundantWith[pair.descriptorB].push({ key: pair.descriptorA, pearsonR: pair.pearsonR })
  }

  const descriptors = descriptorKeys.map(key => {
    const stat = stats[key] || { variance: 0, validCount: 0, missingRate: 1 }
    const insufficient = stat.validCount < MIN_VALID_SAMPLES
    const lowVariance = !insufficient && stat.variance <= varianceThreshold
    const redundant = (redundantWith[key] || [])
    let action = "keep"
    if (insufficient) action = "review"
    else if (redundant.length) action = "penalize"
    else if (lowVariance) action = "review"
    return {
      descriptorKey: key,
      variance: stat.variance,
      validCount: stat.validCount,
      missingRate: stat.missingRate,
      insufficientData: insufficient,
      lowInformation: lowVariance,
      redundantWith: redundant.map(row => row.key),
      pearsonR: redundant.length ? redundant[0].pearsonR : null,
      action,
    }
  })

  return {
    descriptorCount: descriptorKeys.length,
    lowVarianceCount: descriptors.filter(row => row.lowInformation).length,
    redundantPairCount: redundantPairs.length,
    insufficientDataCount: descriptors.filter(row => row.insufficientData).length,
    correlationThreshold,
    varianceThreshold,
    minValidSamples: MIN_VALID_SAMPLES,
    redundantPairs,
    descriptors,
    boundary: "Audit only. The gate does not delete descriptors and does not modify OACS/DMRS formulas.",
    boundaryZh: "仅审计。该门控不删除描述符，也不修改 OACS/DMRS 公式。",
    notFinalRecommendation: true,
  }
}

// A separate, opt-in preview weight penalty (never a formula change). Each redundant
// descriptor keeps a weight < 1 so duplicated signals are down-weighted only in
// preview adjustments, not in the OACS/DMRS scoring formulas.
export function buildRedundancyWeightPenalty(descriptorKeys = DEFAULT_DESCRIPTOR_KEYS, redundantPairs = [], penalty = 0.7) {
  const weights = {}
  for (const key of descriptorKeys) weights[key] = 1
  const penalized = new Set()
  for (const pair of redundantPairs) {
    // Penalize the second member of each redundant pair as the duplicate signal.
    penalized.add(pair.descriptorB)
  }
  for (const key of penalized) weights[key] = penalty
  return {
    weights,
    penalizedDescriptors: [...penalized],
    penalty,
    boundary: "Preview adjustment only; OACS/DMRS formulas are unchanged.",
    boundaryZh: "仅预览调整；OACS/DMRS 公式未修改。",
    notFinalRecommendation: true,
  }
}
