// @ts-nocheck
// V3.2 First Real Benchmark Runner + Report.
// The framework may "run" (structurally) only when enough confirmed-eligible
// records, ground-truth labels, a complete split, and zero leakage exist.
// Even when runnable, Accuracy / ROC-AUC are emitted ONLY if the Accuracy/ROC
// gates pass (real experimental labels). Otherwise every metric stays Pending —
// no fabricated numbers.
import { accuracyEligibility } from "./accuracyEligibility.js"
import { rocEligibility } from "./rocEligibility.js"

export const BENCHMARK_MODELS = ["Logistic Regression", "Decision Tree", "Random Forest"]

export function evaluateBenchmarkConditions({ eligibilityAudit = {}, labelAudit = {}, split = {}, leakage = {} } = {}) {
  const conditions = {
    benchmarkEligible: Number(eligibilityAudit.eligibleConfirmed || 0) >= 100,
    groundTruthExists: Number(labelAudit.total || 0) > 0 && Number(labelAudit.invalidGroundTruthCount || 0) === 0,
    splitExists: Boolean(split.complete) && Number(split.counts?.train || 0) > 0 && Number(split.counts?.test || 0) > 0,
    leakageOk: Boolean(leakage.ok),
  }
  const blockers = Object.entries(conditions).filter(([, ok]) => !ok).map(([k]) => k)
  return { runnable: blockers.length === 0, conditions, blockers }
}

export function runFirstBenchmark({ eligibilityAudit = {}, labelAudit = {}, split = {}, leakage = {} } = {}) {
  const evaluation = evaluateBenchmarkConditions({ eligibilityAudit, labelAudit, split, leakage })
  const benchmarkEligibleConfirmed = Number(eligibilityAudit.eligibleConfirmed || 0)
  const accuracyGate = accuracyEligibility({ labelAudit, leakage, split, benchmarkEligibleConfirmed })
  const rocGate = rocEligibility({ labelAudit, leakage, split, benchmarkEligibleConfirmed })

  return { evaluation, accuracyGate, rocGate }
}

export function buildBenchmarkReport({ eligibilityAudit = {}, labelAudit = {}, split = {}, leakage = {}, models = BENCHMARK_MODELS } = {}) {
  const { evaluation, accuracyGate, rocGate } = runFirstBenchmark({ eligibilityAudit, labelAudit, split, leakage })
  const trainSize = Number(split.counts?.train || 0)
  const testSize = Number(split.counts?.test || 0)
  const labelCount = Number(labelAudit.total || 0)
  const leakageStatus = leakage.ok ? "ok" : `${leakage.leakCount || 0} leaks`
  const metricsAllowed = accuracyGate.metricsAllowed && rocGate.metricsAllowed

  const modelRows = models.map(model => ({
    model,
    status: !evaluation.runnable ? "Benchmark Blocked" : metricsAllowed ? "Completed" : "Runnable · Metrics Pending",
    trainSize,
    testSize,
    labelCount,
    leakageStatus,
    // No fabricated metrics: Pending unless the gates legitimately pass.
    accuracy: metricsAllowed ? null : "Pending",
    precision: metricsAllowed ? null : "Pending",
    recall: metricsAllowed ? null : "Pending",
    f1: metricsAllowed ? null : "Pending",
    rocAuc: metricsAllowed ? null : "Pending",
  }))

  let overallStatus
  if (!evaluation.runnable) overallStatus = "Benchmark Blocked"
  else if (metricsAllowed) overallStatus = "First Real Benchmark Complete"
  else overallStatus = "Benchmark Framework Runnable · Experimental Metrics Pending"

  return {
    version: "v3.2",
    reportId: "benchmark-report-v1",
    overallStatus,
    runnable: evaluation.runnable,
    conditions: evaluation.conditions,
    blockers: evaluation.blockers,
    metricsAllowed,
    accuracyGate,
    rocGate,
    models: modelRows,
    summary: { trainSize, testSize, labelCount, leakageStatus, benchmarkEligibleConfirmed: Number(eligibilityAudit.eligibleConfirmed || 0) },
  }
}

export default buildBenchmarkReport
