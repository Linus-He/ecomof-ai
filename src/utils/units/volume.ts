// @ts-nocheck
export function normalizeVolumeUnit(unit) {
  const key = String(unit || "").trim().replace(/³/g, "3").replace(/\s+/g, "").toLowerCase()
  if (key === "cm3/g") return "cm³/g"
  if (key === "ml/g") return "mL/g"
  throw new Error(`Unsupported volume unit: ${unit}`)
}
