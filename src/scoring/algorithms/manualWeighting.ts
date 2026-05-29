// @ts-nocheck
import { normalizeWeightMap } from "../types/scoringTypes"

export function computeManualWeighting({ descriptors = [], manualWeights = {} } = {}) {
  const weights = normalizeWeightMap(manualWeights, descriptors)
  const hasPositiveWeight = Object.values(manualWeights || {}).some(value => Number(value) > 0)
  return {
    weights,
    diagnostics: { method: "manual", fallbackUsed: !hasPositiveWeight },
    warnings: hasPositiveWeight ? [] : ["Manual weights were empty or zero; equal weights were used."],
    explanation: hasPositiveWeight
      ? "Manual weights were normalized so their sum equals 1."
      : "Manual weights were unavailable, so the engine used equal weights.",
  }
}
