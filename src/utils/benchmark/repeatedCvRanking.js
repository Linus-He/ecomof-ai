// @ts-nocheck
// V3.6 Model Comparison V2 — ranks Logistic Regression / Decision Tree / Random
// Forest across every fold of repeated cross-validation and reports each model's
// Win Rate, Average Rank, and Rank Variance. Answers "which model is best in the
// long run, not just on one split?". Real per-fold metrics.
import { runCrossValidation } from "./crossValidationRunner.js"
import { BENCHMARK_MODELS } from "./runRealBenchmark.js"
import { mean, std } from "./confidenceIntervalAnalysis.js"

const r4 = v => Number(Number(v).toFixed(4))

export function buildRepeatedCvRanking({ records = [], folds = 5, repeats = 5, models = BENCHMARK_MODELS, seed = 17, metric = "accuracy" } = {}) {
  const ranksByModel = Object.fromEntries(models.map(m => [m, []]))
  const winsByModel = Object.fromEntries(models.map(m => [m, 0]))
  let comparisons = 0

  for (let r = 0; r < repeats; r += 1) {
    const cv = runCrossValidation({ records, folds, seed: seed + r * 1000, models })
    const k = cv.k
    for (let f = 0; f < k; f += 1) {
      // Collect each model's metric for this fold.
      const scores = models
        .map(name => {
          const row = cv.models.find(m => m.model === name)
          const fold = row?.folds?.[f]
          return { model: name, value: fold && fold[metric === "accuracy" ? "accuracy" : metric] != null ? fold[metric === "accuracy" ? "accuracy" : metric] : null }
        })
        .filter(s => s.value != null)
      if (scores.length < 2) continue
      comparisons += 1
      // Rank: 1 = best (highest metric). Ties share the averaged rank.
      const sorted = [...scores].sort((a, b) => b.value - a.value)
      sorted.forEach((s, i) => { ranksByModel[s.model].push(i + 1) })
      const best = sorted[0].value
      for (const s of scores) if (s.value === best) winsByModel[s.model] += 1
    }
  }

  const rows = models.map(name => {
    const ranks = ranksByModel[name]
    const variance = ranks.length ? std(ranks) ** 2 : 0
    return {
      model: name,
      winRate: comparisons ? r4(winsByModel[name] / comparisons) : 0,
      wins: winsByModel[name],
      averageRank: ranks.length ? r4(mean(ranks)) : null,
      rankVariance: r4(variance),
      comparisons,
    }
  }).sort((a, b) => (a.averageRank ?? 9) - (b.averageRank ?? 9))

  return {
    rankingId: "repeated-cv-ranking-v1",
    metric,
    folds,
    repeats,
    comparisons,
    rows,
    bestModel: rows[0]?.model || null,
  }
}

export default buildRepeatedCvRanking
