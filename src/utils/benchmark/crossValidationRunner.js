// @ts-nocheck
// V3.5 Cross Validation Runner — real k-fold CV (5-fold / 10-fold) of the three
// V3.4 models on the experimental-label dataset. This is a SEPARATE stability
// estimate; it does not touch the V3.4 benchmark numbers. Deterministic folds.
import { featureVector, FEATURE_KEYS } from "../dataIngestion/experimentalLabelDataset.js"
import { MODEL_TRAINERS, computeMetrics } from "./mlModels.js"
import { BENCHMARK_MODELS } from "./runRealBenchmark.js"

const mean = arr => (arr.length ? arr.reduce((a, v) => a + v, 0) / arr.length : 0)
const std = arr => { if (arr.length < 2) return 0; const m = mean(arr); return Math.sqrt(arr.reduce((a, v) => a + (v - m) ** 2, 0) / arr.length) }
const r4 = v => Number(v.toFixed(4))

// Deterministic fold assignment (seeded shuffle, round-robin into k folds).
export function kFoldIndices(n, k, seed = 17) {
  const idx = Array.from({ length: n }, (_, i) => i)
  let s = seed >>> 0
  for (let i = n - 1; i > 0; i -= 1) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]] }
  const folds = Array.from({ length: k }, () => [])
  idx.forEach((v, i) => folds[i % k].push(v))
  return folds
}

function encode(records) {
  return {
    X: records.map(featureVector),
    y: records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0)),
  }
}

// Runs k-fold CV for every model. Returns per-fold metrics + mean/std + a
// stability score (1 - normalized accuracy std).
export function runCrossValidation({ records = [], folds = 5, models = BENCHMARK_MODELS, featureKeys = FEATURE_KEYS, seed = 17 } = {}) {
  const k = Math.min(folds, records.length)
  const foldIdx = kFoldIndices(records.length, k, seed)

  const perModel = models.map(name => {
    const foldRows = []
    for (let f = 0; f < k; f += 1) {
      const testIds = new Set(foldIdx[f])
      const train = records.filter((_, i) => !testIds.has(i))
      const test = records.filter((_, i) => testIds.has(i))
      const trainXY = encode(train)
      const testXY = encode(test)
      if (new Set(trainXY.y).size < 2 || test.length === 0) {
        foldRows.push({ fold: f + 1, accuracy: null, roc: null, f1: null, skipped: true })
        continue
      }
      const fitted = MODEL_TRAINERS[name](trainXY.X, trainXY.y)
      const m = computeMetrics(testXY.y, fitted.predictProba(testXY.X))
      foldRows.push({ fold: f + 1, accuracy: m.accuracy, roc: m.rocAuc, f1: m.f1 })
    }
    const acc = foldRows.filter(r => r.accuracy != null).map(r => r.accuracy)
    const roc = foldRows.filter(r => r.roc != null).map(r => r.roc)
    const f1 = foldRows.filter(r => r.f1 != null).map(r => r.f1)
    const accMean = mean(acc)
    const accStd = std(acc)
    return {
      model: name,
      folds: foldRows,
      accuracyMean: r4(accMean),
      accuracyStd: r4(accStd),
      rocMean: r4(mean(roc)),
      rocStd: r4(std(roc)),
      f1Mean: r4(mean(f1)),
      f1Std: r4(std(f1)),
      // Stability score: 1 minus the coefficient of variation of fold accuracy.
      stabilityScore: r4(Math.max(0, 1 - (accMean ? accStd / accMean : 1))),
    }
  })

  return { runId: `cross-validation-${k}fold`, k, datasetSize: records.length, models: perModel }
}

export default runCrossValidation
