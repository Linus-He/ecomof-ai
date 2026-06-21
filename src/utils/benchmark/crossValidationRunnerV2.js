// @ts-nocheck
// V3.6 Cross Validation Runner V2 — adds Repeated 5-fold on top of the V3.5
// 5-fold / 10-fold runner. Repeated CV reruns 5-fold with different seeds and
// aggregates every fold metric, giving a much tighter estimate of Accuracy /
// ROC / F1 mean ± std. Real retraining each fold; deterministic seeds.
import { runCrossValidation } from "./crossValidationRunner.js"
import { BENCHMARK_MODELS } from "./runRealBenchmark.js"
import { mean, std } from "./confidenceIntervalAnalysis.js"

const r4 = v => Number(Number(v).toFixed(4))

// Repeated k-fold CV: `repeats` independent shuffles, all folds pooled.
export function repeatedCrossValidation({ records = [], folds = 5, repeats = 5, models = BENCHMARK_MODELS, seed = 17 } = {}) {
  const perModel = Object.fromEntries(models.map(m => [m, { accuracy: [], roc: [], f1: [] }]))
  const runs = []
  for (let r = 0; r < repeats; r += 1) {
    const cv = runCrossValidation({ records, folds, seed: seed + r * 1000, models })
    runs.push(cv)
    for (const m of cv.models) {
      for (const f of m.folds) {
        if (f.accuracy != null) perModel[m.model].accuracy.push(f.accuracy)
        if (f.roc != null) perModel[m.model].roc.push(f.roc)
        if (f.f1 != null) perModel[m.model].f1.push(f.f1)
      }
    }
  }
  const summary = models.map(name => {
    const d = perModel[name]
    return {
      model: name,
      accuracyMean: r4(mean(d.accuracy)),
      accuracyStd: r4(std(d.accuracy)),
      rocMean: r4(mean(d.roc)),
      rocStd: r4(std(d.roc)),
      f1Mean: r4(mean(d.f1)),
      f1Std: r4(std(d.f1)),
      foldCount: d.accuracy.length,
    }
  })
  return { runId: `repeated-${folds}fold-x${repeats}`, folds, repeats, totalFolds: folds * repeats, models: summary, distributions: perModel }
}

// Full V2 bundle: 5-fold, 10-fold, and repeated 5-fold.
export function runCrossValidationV2({ records = [], models = BENCHMARK_MODELS, seed = 17, repeats = 5 } = {}) {
  return {
    runId: "cross-validation-v2",
    fiveFold: runCrossValidation({ records, folds: 5, models, seed }),
    tenFold: runCrossValidation({ records, folds: 10, models, seed }),
    repeatedFiveFold: repeatedCrossValidation({ records, folds: 5, repeats, models, seed }),
  }
}

export default runCrossValidationV2
