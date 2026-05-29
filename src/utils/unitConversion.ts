export type UptakeUnit = "mmol/g" | "cm3/g (STP)" | "cm³/g (STP)" | "mg/g" | "wt%"

const MOLAR_MASS_G_PER_MOL: Record<string, number> = {
  CO2: 44.01,
  N2: 28.014,
  CH4: 16.043,
  H2: 2.016,
  O2: 31.998,
}

const STP_CM3_PER_MMOL = 22.414

export interface UptakeConversionOptions {
  gas?: string
  molarMassGPerMol?: number
}

function normalizedUnit(unit: string): UptakeUnit {
  if (unit === "cm³/g (STP)") return "cm3/g (STP)"
  return unit as UptakeUnit
}

function molarMass(options?: UptakeConversionOptions): number {
  if (options?.molarMassGPerMol && options.molarMassGPerMol > 0) {
    return options.molarMassGPerMol
  }
  const gas = String(options?.gas || "CO2").toUpperCase()
  return MOLAR_MASS_G_PER_MOL[gas] || MOLAR_MASS_G_PER_MOL.CO2
}

function toMmolPerGram(value: number, fromUnit: string, options?: UptakeConversionOptions): number {
  const unit = normalizedUnit(fromUnit)
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  if (unit === "mmol/g") return number
  if (unit === "cm3/g (STP)") return number / STP_CM3_PER_MMOL
  if (unit === "mg/g") return number / molarMass(options)
  if (unit === "wt%") return (number * 10) / molarMass(options)
  throw new Error(`Unsupported uptake unit: ${fromUnit}`)
}

function fromMmolPerGram(value: number, toUnit: string, options?: UptakeConversionOptions): number {
  const unit = normalizedUnit(toUnit)
  if (unit === "mmol/g") return value
  if (unit === "cm3/g (STP)") return value * STP_CM3_PER_MMOL
  if (unit === "mg/g") return value * molarMass(options)
  if (unit === "wt%") return (value * molarMass(options)) / 10
  throw new Error(`Unsupported uptake unit: ${toUnit}`)
}

export function convertUptake(
  value: number,
  fromUnit: UptakeUnit,
  toUnit: UptakeUnit,
  options?: UptakeConversionOptions,
): number {
  return fromMmolPerGram(toMmolPerGram(value, fromUnit, options), toUnit, options)
}
