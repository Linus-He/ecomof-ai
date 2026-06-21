// @ts-nocheck
// V3.9 fallback — the single source of truth for the "missing value" vocabulary.
// Every data card routes missing fields through here so the UI never shows
// undefined / null / NaN / [object Object] / empty cards.
export const MISSING_LABELS = Object.freeze({
  source: "Unknown source",
  descriptor: "Descriptor unavailable",
  curation: "Pending curation",
  provenance: "Missing provenance",
  benchmark: "Benchmark not eligible",
  organicAcid: "Organic acid relevance not assigned",
  evidence: "Evidence not available",
  confidence: "Confidence pending",
  sourceType: "Source type unknown",
  coverage: "Data coverage unavailable",
  generic: "Not available",
})

export type MissingKind = keyof typeof MISSING_LABELS

const FORBIDDEN = new Set(["undefined", "null", "nan", "[object object]", ""])

export function isMissing(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "number") return !Number.isFinite(value)
  if (typeof value === "string") return FORBIDDEN.has(value.trim().toLowerCase())
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.length === 0
    return Object.keys(value).length === 0
  }
  return false
}

// Returns the value as a clean string, or the kind-specific fallback label.
export function normalizeMissingValue(value: unknown, kind: MissingKind = "generic"): string {
  if (isMissing(value)) return MISSING_LABELS[kind] || MISSING_LABELS.generic
  if (typeof value === "object") {
    // Never leak "[object Object]" into the UI.
    try {
      const json = JSON.stringify(value)
      return json === "{}" || json === "[]" ? MISSING_LABELS[kind] : json
    } catch {
      return MISSING_LABELS[kind] || MISSING_LABELS.generic
    }
  }
  return String(value)
}

export default normalizeMissingValue
