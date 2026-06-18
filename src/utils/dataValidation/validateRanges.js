// @ts-nocheck
// Physical plausibility ranges for normalized (canonical-unit) values.
const RANGES = {
  surfaceArea: [0, 10000],
  poreVolume: [0, 6],
  poreSizeA: [0, 100],
  density: [0, 12],
  voidFraction: [0, 1],
  bandGap: [0, 12],
  temperature: [-50, 600],
  pressure: [0, 1000],
  reactionTime: [0, 2000],
  pH: [0, 14],
  yield: [0, 100],
  selectivity: [0, 100],
  conversion: [0, 100],
}

function valueOf(record, field) {
  return record.mof?.[field] ?? record.reaction?.[field] ?? record.performance?.[field]
}

export function validateRanges(record = {}) {
  const outOfRange = []
  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const value = valueOf(record, field)
    if (value == null || !Number.isFinite(Number(value))) continue
    const num = Number(value)
    if (num < min || num > max) outOfRange.push(`${field}=${num} outside [${min}, ${max}]`)
  }
  return { check: "ranges", ok: outOfRange.length === 0, outOfRange }
}
