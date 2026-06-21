// @ts-nocheck
// V3.6 Confidence Interval Framework — 95% CIs for Accuracy / ROC-AUC /
// Precision / Recall / F1. Given a distribution of metric values (bootstrap
// resamples or CV folds) it returns the mean and the [lower, upper] bounds.
// Percentile method by default; normal-approximation available. Real numbers
// only — nothing fabricated.
const r4 = v => (v == null ? null : Number(Number(v).toFixed(4)))

export function mean(values = []) {
  const v = values.filter(x => x != null)
  return v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0
}
export function std(values = []) {
  const v = values.filter(x => x != null)
  if (v.length < 2) return 0
  const m = mean(v)
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length)
}
function percentile(sorted, p) {
  if (!sorted.length) return null
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function confidenceInterval(values = [], { level = 0.95, method = "percentile" } = {}) {
  const v = values.filter(x => x != null)
  const m = mean(v)
  const s = std(v)
  if (v.length === 0) return { mean: null, lower: null, upper: null, std: null, n: 0, level, method }
  let lower
  let upper
  if (method === "normal") {
    const z = 1.96 // 95%
    const se = s / Math.sqrt(v.length)
    lower = m - z * se
    upper = m + z * se
  } else {
    const sorted = [...v].sort((a, b) => a - b)
    const alpha = (1 - level) / 2
    lower = percentile(sorted, alpha)
    upper = percentile(sorted, 1 - alpha)
  }
  return { mean: r4(m), lower: r4(Math.max(0, lower)), upper: r4(Math.min(1, upper)), std: r4(s), n: v.length, level, method }
}

// Per-metric CI table. `distributions` maps metric name -> array of values.
export function confidenceIntervalAnalysis({ distributions = {}, level = 0.95, method = "percentile" } = {}) {
  const metrics = {}
  for (const [name, values] of Object.entries(distributions)) {
    metrics[name] = confidenceInterval(values, { level, method })
  }
  return { analysisId: "confidence-interval-analysis-v1", level, method, metrics }
}

export default confidenceIntervalAnalysis
