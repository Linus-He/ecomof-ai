// @ts-nocheck
// V3.4 First Real Benchmark Runner — actually fits Logistic Regression, a
// Decision Tree, and a Random Forest on the experimental-label training split
// and evaluates them on the internal test split and the independent external
// test set. The metrics are REAL outputs of fitted models; they are emitted only
// when the Accuracy / ROC gates pass, otherwise the report stays Pending.
import { featureVector } from "../dataIngestion/experimentalLabelDataset.js"
import { MODEL_TRAINERS, computeMetrics } from "./mlModels.js"

export const BENCHMARK_MODELS = ["Logistic Regression", "Decision Tree", "Random Forest"]

const POSITIVE = new Set(["promising", "active", "high", "selective", "positive", "1", "yes", "true"])

export function encodeClass(value) {
  return POSITIVE.has(String(value ?? "").trim().toLowerCase()) ? 1 : 0
}

function toXY(records = []) {
  const X = []
  const y = []
  for (const r of records) {
    X.push(featureVector(r))
    y.push(encodeClass(r.groundTruthClass ?? r.binaryLabel ?? r.groundTruthLabel))
  }
  return { X, y }
}

// Train + evaluate all three models. Always computes real metrics; the gate
// flag decides whether they are exposed or reported Pending.
export function runRealBenchmark({ trainRecords = [], validationRecords = [], testRecords = [], externalTestRecords = [], metricsAllowed = false, models = BENCHMARK_MODELS } = {}) {
  const train = toXY(trainRecords)
  const test = toXY(testRecords)
  const external = toXY(externalTestRecords)

  const trainSize = trainRecords.length
  const validationSize = validationRecords.length
  const testSize = testRecords.length
  const externalTestSize = externalTestRecords.length

  const canRun = train.X.length > 0 && new Set(train.y).size > 1

  const results = models.map(name => {
    const row = {
      model: name,
      trainSize,
      validationSize,
      testSize,
      externalTestSize,
    }
    if (!canRun) {
      return { ...row, trained: false, status: "Cannot fit (insufficient labelled training data / single class)", testMetrics: null, externalMetrics: null }
    }
    const fitted = MODEL_TRAINERS[name](train.X, train.y)
    const testProba = test.X.length ? fitted.predictProba(test.X) : []
    const extProba = external.X.length ? fitted.predictProba(external.X) : []
    const testMetrics = test.X.length ? computeMetrics(test.y, testProba) : null
    const externalMetrics = external.X.length ? computeMetrics(external.y, extProba) : null
    return {
      ...row,
      trained: true,
      status: metricsAllowed ? "Completed" : "Runnable · Metrics Pending",
      // Real metrics from fitted models. Only surfaced when the gate allows it.
      testMetrics: metricsAllowed ? testMetrics : null,
      externalMetrics: metricsAllowed ? externalMetrics : null,
      // Always keep the raw computed metrics for the build-time report/leaderboard.
      computed: { testMetrics, externalMetrics },
    }
  })

  return {
    runId: "first-real-benchmark",
    models: results,
    canRun,
    metricsAllowed,
    sizes: { trainSize, validationSize, testSize, externalTestSize },
  }
}

export default runRealBenchmark
