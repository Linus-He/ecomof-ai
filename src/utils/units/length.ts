// @ts-nocheck
const LENGTH_TO_ANGSTROM = {
  "å": 1,
  a: 1,
  angstrom: 1,
  angstroms: 1,
  nm: 10,
  pm: 0.01,
  m: 1e10,
}

function lengthKey(unit) {
  return String(unit || "").trim().toLowerCase()
}

export function normalizeLengthUnit(unit) {
  const key = lengthKey(unit)
  if (key === "å" || key === "a" || key === "angstrom" || key === "angstroms") return "Å"
  if (key === "nm") return "nm"
  if (key === "pm") return "pm"
  if (key === "m") return "m"
  throw new Error(`Unsupported length unit: ${unit}`)
}

export function convertLength(value, fromUnit, toUnit) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid length value: ${value}`)
  const fromFactor = LENGTH_TO_ANGSTROM[lengthKey(fromUnit)]
  const toFactor = LENGTH_TO_ANGSTROM[lengthKey(toUnit)]
  if (!fromFactor) throw new Error(`Unsupported length unit: ${fromUnit}`)
  if (!toFactor) throw new Error(`Unsupported length unit: ${toUnit}`)
  return (number * fromFactor) / toFactor
}
