// @ts-nocheck
// V3.9 fallback — safe numeric coercion. Never returns NaN/undefined/null:
// non-finite input falls back to the provided default (0 by default).
export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

// Rounds a safe number to `decimals` places (still never NaN).
export function safeRound(value: unknown, decimals = 0, fallback = 0): number {
  const n = safeNumber(value, fallback)
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

export default safeNumber
