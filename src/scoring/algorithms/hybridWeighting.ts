// @ts-nocheck
import { computeCriticWeighting } from "./criticWeighting"
import { computeManualWeighting } from "./manualWeighting"
import { clamp01, normalizeWeightMap } from "../types/scoringTypes"

export function computeHybridWeighting(args = {}) {
  const alpha = clamp01(args.hybridAlpha ?? args.options?.hybridAlpha ?? 0.65, 0.65)
  const critic = computeCriticWeighting(args)
  const manual = computeManualWeighting(args)
  const blended = {}
  ;(args.descriptors || []).forEach(descriptor => {
    const key = descriptor.key
    blended[key] = alpha * (critic.weights?.[key] || 0) + (1 - alpha) * (manual.weights?.[key] || 0)
  })
  const weights = normalizeWeightMap(blended, args.descriptors || [])
  const finalTotal = Object.values(weights).reduce((sum, value) => sum + (Number(value) || 0), 0)
  const fallbackUsed = Boolean(critic.diagnostics?.fallbackUsed || manual.diagnostics?.fallbackUsed || !Number.isFinite(finalTotal) || finalTotal <= 0)
  return {
    weights,
    diagnostics: {
      method: "hybrid",
      alpha,
      actualAlpha: alpha,
      critic: critic.diagnostics,
      manual: manual.diagnostics,
      expertPriorUsed: Object.values(args.manualWeights || {}).some(value => Number(value) > 0),
      droppedDescriptors: critic.diagnostics?.droppedDescriptors || [],
      fallbackUsed,
      usedFallback: fallbackUsed,
    },
    warnings: [...(critic.warnings || []), ...(manual.warnings || [])],
    explanation: `Hybrid weighting uses alpha=${alpha.toFixed(2)}: alpha * CRITIC + (1 - alpha) * manual weight.`,
  }
}
