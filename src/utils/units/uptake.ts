// @ts-nocheck
export const STP_CM3_PER_MMOL = 22.414

const GAS_MOLAR_MASS = {
  CO2: 44.01,
  N2: 28.014,
  CH4: 16.043,
  H2: 2.016,
  O2: 31.998,
}

function uptakeKey(unit) {
  return String(unit || "")
    .trim()
    .replace(/³/g, "3")
    .replace(/\s+/g, "")
    .toLowerCase()
}

function resolveMolarMass(options = {}) {
  const explicit = Number(options.molarMass ?? options.molarMassGPerMol)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  if (options.gas) {
    const mass = GAS_MOLAR_MASS[String(options.gas).toUpperCase()]
    if (mass) return mass
  }
  return null
}

function requireMolarMass(options, unit) {
  const mass = resolveMolarMass(options)
  if (!mass) throw new Error(`Molar mass is required for ${unit} uptake conversion.`)
  return mass
}

export function normalizeUptakeUnit(unit) {
  const key = uptakeKey(unit)
  if (key === "mmol/g") return "mmol/g"
  if (key === "mol/kg") return "mol/kg"
  if (key === "cm3(stp)/g" || key === "cm3/g(stp)" || key === "cm3/g") return "cm³(STP)/g"
  if (key === "mg/g") return "mg/g"
  if (key === "wt%") return "wt%"
  throw new Error(`Unsupported uptake unit: ${unit}`)
}

function toMmolPerGram(value, unit, options) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`Invalid uptake value: ${value}`)
  const key = uptakeKey(unit)
  if (key === "mmol/g" || key === "mol/kg") return number
  if (key === "cm3(stp)/g" || key === "cm3/g(stp)" || key === "cm3/g") return number / STP_CM3_PER_MMOL
  if (key === "mg/g") return number / requireMolarMass(options, unit)
  if (key === "wt%") return (number * 10) / requireMolarMass(options, unit)
  throw new Error(`Unsupported uptake unit: ${unit}`)
}

function fromMmolPerGram(value, unit, options) {
  const key = uptakeKey(unit)
  if (key === "mmol/g" || key === "mol/kg") return value
  if (key === "cm3(stp)/g" || key === "cm3/g(stp)" || key === "cm3/g") return value * STP_CM3_PER_MMOL
  if (key === "mg/g") return value * requireMolarMass(options, unit)
  if (key === "wt%") return (value * requireMolarMass(options, unit)) / 10
  throw new Error(`Unsupported uptake unit: ${unit}`)
}

export function convertUptake(value, fromUnit, toUnit, options = {}) {
  return fromMmolPerGram(toMmolPerGram(value, fromUnit, options), toUnit, options)
}
