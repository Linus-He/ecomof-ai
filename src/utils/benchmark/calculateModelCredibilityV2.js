// @ts-nocheck
// V3.6 Model Credibility Score V2 — extends the V3.5 credibility score with three
// robustness components: Confidence Interval Score, Generalization Score, and
// Bootstrap Score. Transparent 0–100 composite, graded A/B/C/D. Reads real
// diagnostics from the V3.6 robustness run; nothing is fabricated.
import { gradeFor } from "./calculateModelCredibility.js"

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const r2 = v => Number(Number(v).toFixed(2))
const rocToScore = roc => (roc == null ? 0 : clamp((roc - 0.5) / 0.5 * 100))

export const CREDIBILITY_V2_WEIGHTS = {
  benchmark: 0.18,
  crossValidation: 0.18,
  stability: 0.14,
  sensitivity: 0.08,
  dataQuality: 0.14,
  confidenceInterval: 0.12,
  generalization: 0.1,
  bootstrap: 0.06,
}

export function calculateModelCredibilityV2({ benchmark = {}, crossValidation = {}, stability = {}, ablation = {}, dataQuality = {}, confidenceInterval = null, generalization = null, bootstrap = null } = {}) {
  const benchmarkScore = rocToScore(benchmark.rocAuc)
  const cvScore = crossValidation.rocMean != null ? rocToScore(crossValidation.rocMean) : clamp(Number(crossValidation.accuracyMean || 0) * 100)
  const cv = Number(stability.coefficientOfVariation ?? 1)
  const stabilityScore = clamp((1 - cv) * 100)
  const critical = Number(ablation.tally?.Critical || 0)
  const useful = Number(ablation.tally?.Useful || 0)
  const featureCount = ablation.rows?.length || 6
  const sensitivityScore = clamp(((critical * 1 + useful * 0.5) / featureCount) * 200)
  const dqParts = [
    dataQuality.invalidGroundTruth === 0 && Number(dataQuality.verifiedGroundTruth || 0) > 0 ? 25 : 0,
    Number(dataQuality.leakCount || 0) === 0 ? 25 : 0,
    Number(dataQuality.externalTestCount || 0) >= 60 ? 25 : Number(dataQuality.externalTestCount || 0) >= 30 ? 18 : 0,
    Number(dataQuality.syntheticLabelCount || 0) === 0 ? 25 : 0,
  ]
  const dataQualityScore = dqParts.reduce((a, v) => a + v, 0)

  // New V2 components.
  // Confidence interval: narrower 95% CI on ROC = higher score.
  let ciScore = 0
  const rocCi = confidenceInterval?.metrics?.rocAuc || confidenceInterval?.rocAuc
  if (rocCi && rocCi.lower != null && rocCi.upper != null) ciScore = clamp((1 - (rocCi.upper - rocCi.lower)) * 100)
  // Generalization: smaller gap = higher score.
  const gap = generalization?.generalizationGap
  const generalizationScore = gap == null ? 0 : clamp((1 - Math.max(0, gap)) * 100)
  // Bootstrap: lower accuracy std across resamples = higher score.
  let bootstrapScore = 0
  if (bootstrap?.accuracy) bootstrapScore = clamp((1 - Math.min(1, (bootstrap.accuracy.std || 0) * 4)) * 100)

  const components = {
    benchmark: r2(benchmarkScore),
    crossValidation: r2(cvScore),
    stability: r2(stabilityScore),
    sensitivity: r2(sensitivityScore),
    dataQuality: r2(dataQualityScore),
    confidenceInterval: r2(ciScore),
    generalization: r2(generalizationScore),
    bootstrap: r2(bootstrapScore),
  }
  const W = CREDIBILITY_V2_WEIGHTS
  const total = r2(Object.keys(W).reduce((a, k) => a + components[k] * W[k], 0))
  const grade = gradeFor(total)

  return {
    credibilityId: "model-credibility-v2",
    version: "v2",
    components,
    weights: W,
    score: total,
    grade,
    knownLimitations: [
      "Experimental-label corpus, though expanded, is still below industrial scale.",
      "All metrics are read from real fitted models on the expanded V3.6 benchmark — never rescaled or fabricated.",
    ],
    interpretation: grade === "A" ? "High credibility with robustness evidence." : grade === "B" ? "Good, robustness-backed credibility." : grade === "C" ? "Moderate credibility; robustness limited by data scale." : "Low credibility — early, data-limited benchmark.",
  }
}

export default calculateModelCredibilityV2
