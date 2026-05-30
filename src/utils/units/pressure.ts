// @ts-nocheck
const PRESSURE_TO_PA = {
  pa: 1,
  kpa: 1000,
  mpa: 1000000,
  bar: 100000,
  atm: 101325,
  mmhg: 101325 / 760,
  torr: 101325 / 760,
}

function pressureKey(unit) {
  return String(unit || "").trim().replace(/\s+/g, "").toLowerCase()
}

export function normalizePressureUnit(unit) {
  const key = pressureKey(unit)
  if (key === "pa") return "Pa"
  if (key === "kpa") return "kPa"
  if (key === "mpa") return "MPa"
  if (key === "bar") return "bar"
  if (key === "atm") return "atm"
  if (key === "mmhg") return "mmHg"
  if (key === "torr") return "torr"
  throw new Error(`Unsupported pressure unit: ${unit}`)
}

export function convertPressure(value, fromUnit, toUnit) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid pressure value: ${value}`)
  const fromKey = pressureKey(fromUnit)
  const toKey = pressureKey(toUnit)
  const fromFactor = PRESSURE_TO_PA[fromKey]
  const toFactor = PRESSURE_TO_PA[toKey]
  if (!fromFactor) throw new Error(`Unsupported pressure unit: ${fromUnit}`)
  if (!toFactor) throw new Error(`Unsupported pressure unit: ${toUnit}`)
  return (number * fromFactor) / toFactor
}
