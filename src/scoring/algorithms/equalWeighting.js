import { normalizeWeightMap } from "../types/scoringTypes"

export function computeEqualWeighting({ descriptors = [] } = {}) {
  const weights = normalizeWeightMap({}, descriptors)
  return {
    weights,
    diagnostics: { method: "equal", fallbackUsed: false },
    warnings: [],
    explanation: "Every selected descriptor receives the same normalized weight.",
  }
}
