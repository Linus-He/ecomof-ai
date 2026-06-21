// @ts-nocheck
// V3.9 fallback — safe percentage formatting. Accepts either a 0..1 ratio or a
// numerator/denominator pair and returns a clean "NN%" string, or a fallback
// label ("Data coverage unavailable" by default) when the value is missing /
// the denominator is 0. Never emits NaN%, undefined%, or Infinity%.
import { safeNumber } from "./safeNumber"

export const COVERAGE_FALLBACK = "Data coverage unavailable"

export function safeRatio(numerator: unknown, denominator: unknown, fallback: number | null = null): number | null {
  const d = safeNumber(denominator, 0)
  if (d === 0) return fallback
  return safeNumber(numerator, 0) / d
}

export function safePercent(ratio: unknown, options: { decimals?: number; fallback?: string } = {}): string {
  const { decimals = 0, fallback = COVERAGE_FALLBACK } = options
  if (ratio == null || (typeof ratio === "number" && !Number.isFinite(ratio))) return fallback
  const r = safeNumber(ratio, NaN)
  if (!Number.isFinite(r)) return fallback
  const clamped = Math.max(0, Math.min(1, r))
  const f = 10 ** decimals
  return `${Math.round(clamped * 100 * f) / f}%`
}

// numerator/denominator -> "NN%" (or fallback when denominator is 0/missing).
export function safePercentOf(numerator: unknown, denominator: unknown, options: { decimals?: number; fallback?: string } = {}): string {
  const ratio = safeRatio(numerator, denominator, null)
  return safePercent(ratio, options)
}

export default safePercent
