// @ts-nocheck
// V3.6 Model Reliability Score — a 0–100 reliability index combining how tightly
// the model's metrics cluster (cross-validation + bootstrap variance) with how
// well it generalizes (train→external gap) and how consistent CV is with the
// independent external test. Higher = the headline result is reproducible, not a
// fluke. Reads real diagnostics; fabricates nothing.
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const r2 = v => Number(Number(v).toFixed(2))

export const RELIABILITY_WEIGHTS = { crossValidation: 0.3, bootstrap: 0.3, generalization: 0.25, consistency: 0.15 }

export function reliabilityLevel(score) {
  if (score >= 80) return "Reliable"
  if (score >= 60) return "Moderately Reliable"
  return "Low Reliability"
}

export function calculateModelReliability({ repeatedCvBest = {}, bootstrapSummary = null, generalization = null, externalMetrics = null } = {}) {
  // CV reliability: tighter fold std around the mean = more reliable.
  const cvMean = Number(repeatedCvBest.accuracyMean || 0)
  const cvStd = Number(repeatedCvBest.accuracyStd || 0)
  const crossValidation = clamp((1 - (cvMean ? cvStd / cvMean : 1)) * 100)

  // Bootstrap reliability: narrower 95% CI on accuracy = more reliable.
  let bootstrap = 0
  if (bootstrapSummary?.accuracy?.ci95) {
    const ci = bootstrapSummary.accuracy.ci95
    const width = (ci.upper ?? 1) - (ci.lower ?? 0)
    bootstrap = clamp((1 - width) * 100)
  }

  // Generalization reliability: smaller train→external gap = more reliable.
  const gap = generalization?.generalizationGap
  const generalizationScore = gap == null ? 0 : clamp((1 - Math.max(0, gap)) * 100)

  // Consistency: CV mean vs external test accuracy agree = more reliable.
  let consistency = 0
  if (externalMetrics?.accuracy != null && cvMean) {
    consistency = clamp((1 - Math.abs(cvMean - externalMetrics.accuracy)) * 100)
  }

  const components = {
    crossValidation: r2(crossValidation),
    bootstrap: r2(bootstrap),
    generalization: r2(generalizationScore),
    consistency: r2(consistency),
  }
  const score = r2(
    components.crossValidation * RELIABILITY_WEIGHTS.crossValidation +
    components.bootstrap * RELIABILITY_WEIGHTS.bootstrap +
    components.generalization * RELIABILITY_WEIGHTS.generalization +
    components.consistency * RELIABILITY_WEIGHTS.consistency,
  )
  return {
    reliabilityId: "model-reliability-v1",
    components,
    weights: RELIABILITY_WEIGHTS,
    score,
    level: reliabilityLevel(score),
  }
}

export default calculateModelReliability
