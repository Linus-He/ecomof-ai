// @ts-nocheck
// V3.6 Bootstrap Validation — resamples the held-out prediction pairs (yTrue,
// yScore) with replacement B times (100 / 500 / 1000) and recomputes every
// metric on each resample, producing a real sampling distribution + 95% CI.
// Answers "is the result stable or a fluke?". Deterministic (seeded).
import { computeMetrics } from "./mlModels.js"
import { confidenceInterval, mean, std } from "./confidenceIntervalAnalysis.js"

function mulberry32(seed) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const METRICS = ["accuracy", "precision", "recall", "f1", "rocAuc"]
const r4 = v => (v == null ? null : Number(Number(v).toFixed(4)))

// One bootstrap pass: sample n indices with replacement, compute all metrics.
export function bootstrapValidation({ yTrue = [], yScore = [], iterations = 1000, seed = 99 } = {}) {
  const n = yTrue.length
  const rand = mulberry32(seed)
  const distributions = Object.fromEntries(METRICS.map(m => [m, []]))
  if (n === 0) return { iterations, n, distributions, summary: {} }

  for (let b = 0; b < iterations; b += 1) {
    const yt = []
    const ys = []
    for (let i = 0; i < n; i += 1) {
      const idx = Math.floor(rand() * n)
      yt.push(yTrue[idx])
      ys.push(yScore[idx])
    }
    // Skip degenerate single-class resamples for ROC only (keep accuracy etc.).
    const m = computeMetrics(yt, ys)
    distributions.accuracy.push(m.accuracy)
    distributions.precision.push(m.precision)
    distributions.recall.push(m.recall)
    distributions.f1.push(m.f1)
    if (m.rocAuc != null) distributions.rocAuc.push(m.rocAuc)
  }

  const summary = {}
  for (const metric of METRICS) {
    const values = distributions[metric]
    summary[metric] = {
      mean: r4(mean(values)),
      std: r4(std(values)),
      ci95: confidenceInterval(values, { level: 0.95, method: "percentile" }),
      samples: values.length,
    }
  }

  return { validationId: "bootstrap-validation-v1", iterations, n, distributions, summary }
}

// Convenience: run the three standard iteration counts and return all three.
export function bootstrapSweep({ yTrue = [], yScore = [], seed = 99 } = {}) {
  return {
    "100": bootstrapValidation({ yTrue, yScore, iterations: 100, seed }),
    "500": bootstrapValidation({ yTrue, yScore, iterations: 500, seed }),
    "1000": bootstrapValidation({ yTrue, yScore, iterations: 1000, seed }),
  }
}

export default bootstrapValidation
