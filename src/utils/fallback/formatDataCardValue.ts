// @ts-nocheck
// V3.9 fallback — formats any value for a data card so the rendered output is
// ALWAYS a safe string: never undefined / null / NaN / [object Object]. Supports
// count / percent / ratio / number / text formatting with an optional unit.
import { safeNumber } from "./safeNumber"
import { safePercent } from "./safePercent"
import { normalizeMissingValue, isMissing } from "./normalizeMissingValue"

type CardType = "count" | "number" | "percent" | "ratio" | "text"

export function formatDataCardValue(
  value: unknown,
  options: { type?: CardType; unit?: string; decimals?: number; fallbackKind?: any; fallback?: string } = {},
): string {
  const { type = "text", unit = "", decimals = 0, fallbackKind = "generic", fallback } = options
  if (isMissing(value)) return fallback ?? normalizeMissingValue(value, fallbackKind)

  switch (type) {
    case "count":
    case "number": {
      const n = safeNumber(value, NaN)
      if (!Number.isFinite(n)) return fallback ?? normalizeMissingValue(undefined, fallbackKind)
      const rounded = type === "count" ? Math.round(n) : Number(n.toFixed(decimals))
      const formatted = rounded.toLocaleString("en-US")
      return unit ? `${formatted} ${unit}`.trim() : formatted
    }
    case "ratio":
      return safePercent(value, { decimals, fallback: fallback ?? normalizeMissingValue(undefined, "coverage") })
    case "percent": {
      // Already a percentage number (0..100) -> append %.
      const n = safeNumber(value, NaN)
      if (!Number.isFinite(n)) return fallback ?? normalizeMissingValue(undefined, "coverage")
      return `${Number(n.toFixed(decimals))}%`
    }
    case "text":
    default:
      return normalizeMissingValue(value, fallbackKind)
  }
}

export default formatDataCardValue
