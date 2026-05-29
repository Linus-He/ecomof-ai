// @ts-nocheck
function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function round(value, digits = 6) {
  const number = finiteNumber(value, 0)
  const factor = 10 ** digits
  return Math.round(number * factor) / factor
}

function stableKeys(keys = []) {
  return Array.from(new Set(keys.filter(Boolean)))
}

export function normalizeMatrix(rows = [], keys = [], options = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeKeys = stableKeys(keys)
  const fallback = finiteNumber(options.fallback, 0)
  const stats = safeKeys.reduce((acc, key) => {
    const values = safeRows.map(row => finiteNumber(row?.[key], fallback))
    const min = values.length ? Math.min(...values) : fallback
    const max = values.length ? Math.max(...values) : fallback
    acc[key] = { min, max }
    return acc
  }, {})

  const normalizedRows = safeRows.map(row => (
    safeKeys.reduce((acc, key) => {
      const { min, max } = stats[key] || { min: fallback, max: fallback }
      const raw = finiteNumber(row?.[key], fallback)
      const span = max - min
      acc[key] = Math.abs(span) < 1e-12 ? 0.5 : Math.max(0, Math.min(1, (raw - min) / span))
      return acc
    }, {})
  ))

  return normalizedRows
}

export function calculateStd(values = []) {
  const safeValues = (Array.isArray(values) ? values : []).map(value => finiteNumber(value, 0))
  if (!safeValues.length) return 0
  const mean = safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length
  const variance = safeValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / safeValues.length
  return round(Math.sqrt(Math.max(0, variance)))
}

function pearson(valuesA = [], valuesB = []) {
  const length = Math.min(valuesA.length, valuesB.length)
  if (length < 2) return 0
  const a = valuesA.slice(0, length).map(value => finiteNumber(value, 0))
  const b = valuesB.slice(0, length).map(value => finiteNumber(value, 0))
  const meanA = a.reduce((sum, value) => sum + value, 0) / length
  const meanB = b.reduce((sum, value) => sum + value, 0) / length
  let numerator = 0
  let denomA = 0
  let denomB = 0
  for (let index = 0; index < length; index += 1) {
    const da = a[index] - meanA
    const db = b[index] - meanB
    numerator += da * db
    denomA += da ** 2
    denomB += db ** 2
  }
  const denominator = Math.sqrt(denomA * denomB)
  if (!Number.isFinite(denominator) || denominator <= 1e-12) return 0
  return round(Math.max(-1, Math.min(1, numerator / denominator)))
}

export function calculateCorrelationMatrix(normalizedRows = [], keys = []) {
  const safeKeys = stableKeys(keys)
  return safeKeys.reduce((matrix, keyA) => {
    matrix[keyA] = safeKeys.reduce((row, keyB) => {
      if (keyA === keyB) {
        row[keyB] = 1
      } else {
        row[keyB] = pearson(
          normalizedRows.map(item => item?.[keyA]),
          normalizedRows.map(item => item?.[keyB]),
        )
      }
      return row
    }, {})
    return matrix
  }, {})
}

export function calculateConflict(correlationMatrix = {}, keys = []) {
  const safeKeys = stableKeys(keys)
  return safeKeys.reduce((acc, keyA) => {
    const conflict = safeKeys.reduce((sum, keyB) => {
      const correlation = finiteNumber(correlationMatrix?.[keyA]?.[keyB], keyA === keyB ? 1 : 0)
      return sum + (1 - Math.max(-1, Math.min(1, correlation)))
    }, 0)
    acc[keyA] = round(conflict)
    return acc
  }, {})
}

export function calculateCriticWeights(rows = [], keys = [], options = {}) {
  const safeKeys = stableKeys(keys)
  if (!safeKeys.length) {
    return {
      weights: {},
      normalizedRows: [],
      std: {},
      correlationMatrix: {},
      conflict: {},
      information: {},
      fallbackUsed: true,
    }
  }

  const safeRows = Array.isArray(rows) && rows.length ? rows : [{}]
  const normalizedRows = normalizeMatrix(safeRows, safeKeys, options)
  const correlationMatrix = calculateCorrelationMatrix(normalizedRows, safeKeys)
  const conflict = calculateConflict(correlationMatrix, safeKeys)
  const std = safeKeys.reduce((acc, key) => {
    acc[key] = calculateStd(normalizedRows.map(row => row?.[key]))
    return acc
  }, {})
  const information = safeKeys.reduce((acc, key) => {
    acc[key] = round(finiteNumber(std[key], 0) * finiteNumber(conflict[key], 0))
    return acc
  }, {})
  const totalInformation = safeKeys.reduce((sum, key) => sum + finiteNumber(information[key], 0), 0)
  const fallbackUsed = !Number.isFinite(totalInformation) || totalInformation <= 1e-12
  const equalWeight = 1 / safeKeys.length
  const weights = safeKeys.reduce((acc, key) => {
    acc[key] = round(fallbackUsed ? equalWeight : finiteNumber(information[key], 0) / totalInformation)
    return acc
  }, {})

  return {
    weights,
    normalizedRows,
    std,
    correlationMatrix,
    conflict,
    information,
    fallbackUsed,
  }
}

export function blendWeights(mechanismWeights = {}, criticWeights = {}, ratio = { mechanism: 0.7, critic: 0.3 }) {
  const mechanismRatio = finiteNumber(ratio.mechanism, 0.7)
  const criticRatio = finiteNumber(ratio.critic, 0.3)
  const keys = stableKeys([...Object.keys(mechanismWeights || {}), ...Object.keys(criticWeights || {})])
  return keys.reduce((acc, key) => {
    const mechanism = finiteNumber(mechanismWeights?.[key], 0)
    const critic = finiteNumber(criticWeights?.[key], 0)
    acc[key] = round(mechanismRatio * mechanism + criticRatio * critic)
    return acc
  }, {})
}
