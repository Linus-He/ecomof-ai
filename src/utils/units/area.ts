// @ts-nocheck
export function normalizeAreaUnit(unit) {
  const key = String(unit || "").trim().replace(/\s+/g, "").toLowerCase()
  if (key === "m2/g" || key === "m²/g") return "m²/g"
  throw new Error(`Unsupported area unit: ${unit}`)
}
