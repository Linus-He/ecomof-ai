// @ts-nocheck
// Confirms every normalized field carries the canonical unit (records must be
// run through the standardization engine before validation).
const CANONICAL_UNITS = {
  temperature: "degC",
  pressure: "bar",
  reactionTime: "h",
  poreSizeA: "angstrom",
  surfaceArea: "m^2/g",
  poreVolume: "cm^3/g",
  density: "g/cm^3",
  bandGap: "eV",
  yield: "percent",
  selectivity: "percent",
  conversion: "percent",
}

export function validateUnits(record = {}) {
  const issues = []
  const sources = record.fieldSources || {}
  for (const [field, expected] of Object.entries(CANONICAL_UNITS)) {
    const source = sources[field]
    if (!source || source.normalizedValue == null) continue
    if (source.normalizedUnit !== expected) {
      issues.push(`${field}: expected ${expected}, got ${source.normalizedUnit}`)
    }
  }
  return { check: "units", ok: issues.length === 0, issues }
}
