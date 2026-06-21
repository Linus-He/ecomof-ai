// @ts-nocheck
// V3.5 Model Credibility Score — a transparent 0–100 composite of five evidence
// components, graded A/B/C/D. It READS the frozen V3.4 benchmark numbers and the
// V3.5 diagnostics; it never invents or rescales accuracy / ROC. A small label
// corpus honestly caps the score — that is the intended, non-fabricated signal.
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const r2 = v => Number(Number(v).toFixed(2))

// ROC-AUC of 0.5 (random) → 0; 1.0 (perfect) → 100.
const rocToScore = roc => (roc == null ? 0 : clamp((roc - 0.5) / 0.5 * 100))

export const CREDIBILITY_WEIGHTS = { benchmark: 0.25, crossValidation: 0.25, stability: 0.2, sensitivity: 0.1, dataQuality: 0.2 }

export function gradeFor(score) {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  return "D"
}

export function calculateModelCredibility({ benchmark = {}, crossValidation = {}, stability = {}, ablation = {}, dataQuality = {} } = {}) {
  // Benchmark: V3.4 external-test ROC-AUC (frozen).
  const benchmarkScore = rocToScore(benchmark.rocAuc)

  // Cross validation: mean fold ROC (fall back to mean accuracy if ROC missing).
  const cvScore = crossValidation.rocMean != null ? rocToScore(crossValidation.rocMean) : clamp((Number(crossValidation.accuracyMean || 0)) * 100)

  // Stability: lower coefficient of variation = higher score.
  const cv = Number(stability.coefficientOfVariation ?? 1)
  const stabilityScore = clamp((1 - cv) * 100)

  // Sensitivity: reward models genuinely driven by real features (ablation found
  // Critical/Useful features rather than noise).
  const critical = Number(ablation.tally?.Critical || 0)
  const useful = Number(ablation.tally?.Useful || 0)
  const featureCount = (ablation.rows?.length || 6)
  const sensitivityScore = clamp(((critical * 1 + useful * 0.5) / featureCount) * 200)

  // Data quality: ground truth verified, zero leakage, sufficient external test, no synthetic.
  const dqParts = [
    dataQuality.invalidGroundTruth === 0 && Number(dataQuality.verifiedGroundTruth || 0) > 0 ? 25 : 0,
    Number(dataQuality.leakCount || 0) === 0 ? 25 : 0,
    Number(dataQuality.externalTestCount || 0) >= 30 ? 25 : Number(dataQuality.externalTestCount || 0) >= 20 ? 15 : 0,
    Number(dataQuality.syntheticLabelCount || 0) === 0 ? 25 : 0,
  ]
  const dataQualityScore = dqParts.reduce((a, v) => a + v, 0)

  const components = {
    benchmark: r2(benchmarkScore),
    crossValidation: r2(cvScore),
    stability: r2(stabilityScore),
    sensitivity: r2(sensitivityScore),
    dataQuality: r2(dataQualityScore),
  }
  const total = r2(
    components.benchmark * CREDIBILITY_WEIGHTS.benchmark +
    components.crossValidation * CREDIBILITY_WEIGHTS.crossValidation +
    components.stability * CREDIBILITY_WEIGHTS.stability +
    components.sensitivity * CREDIBILITY_WEIGHTS.sensitivity +
    components.dataQuality * CREDIBILITY_WEIGHTS.dataQuality,
  )
  const grade = gradeFor(total)

  return {
    credibilityId: "model-credibility-v1",
    components,
    weights: CREDIBILITY_WEIGHTS,
    score: total,
    grade,
    knownLimitations: [
      "Experimental-label corpus is small (V3.4: 40 labels), so absolute scores and cross-validation variance are limited.",
      "Benchmark and cross-validation metrics are read from the frozen V3.4 models — never rescaled or fabricated.",
    ],
    interpretation: grade === "A" ? "High credibility." : grade === "B" ? "Good credibility, limited by data scale." : grade === "C" ? "Moderate credibility — defensible but data-limited." : "Low credibility — treat as an early, data-limited benchmark.",
  }
}

export default calculateModelCredibility
