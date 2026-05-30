// @ts-nocheck
export * from "./pressure"
export * from "./uptake"
export * from "./temperature"
export * from "./length"
export * from "./area"
export * from "./volume"

export function normalizeUnitLabel(unit) {
  const raw = String(unit || "").trim()
  const key = raw.replace(/³/g, "3").replace(/²/g, "2").replace(/\s+/g, "").toLowerCase()
  if (key === "m2/g") return "m²/g"
  if (key === "cm3/g") return "cm³/g"
  if (key === "g/cm3") return "g/cm³"
  if (key === "a" || key === "angstrom" || key === "angstroms") return "Å"
  if (key === "cm3(stp)/g" || key === "cm3/g(stp)") return "cm³(STP)/g"
  return raw
}
