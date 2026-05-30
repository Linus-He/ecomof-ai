// @ts-nocheck
const ABSOLUTE_ZERO_C = -273.15

function temperatureKey(unit) {
  const key = String(unit || "").trim().toLowerCase()
  if (key === "c" || key === "°c" || key === "℃" || key === "celsius") return "C"
  if (key === "k" || key === "kelvin") return "K"
  throw new Error(`Unsupported temperature unit: ${unit}`)
}

function toKelvin(value, unit) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid temperature value: ${value}`)
  const key = temperatureKey(unit)
  const kelvin = key === "K" ? number : number + 273.15
  if (kelvin < 0) throw new Error("Temperature cannot be below absolute zero.")
  return kelvin
}

export function convertTemperature(value, fromUnit, toUnit) {
  const kelvin = toKelvin(value, fromUnit)
  return temperatureKey(toUnit) === "K" ? kelvin : kelvin - 273.15
}
