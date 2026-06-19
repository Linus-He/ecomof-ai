// @ts-nocheck
// V3.4 First Real Benchmark — the end-to-end program. Given the experimental
// label set and the external test set it:
//   1. audits the experimental labels (source provenance, synthetic = 0)
//   2. verifies ground truth (rejects algorithm-generated)
//   3. builds a leakage-free 70/15/15 split + external test
//   4. checks data leakage across splits
//   5. evaluates the Accuracy / ROC V2 gates
//   6. fits + evaluates LR / DT / RF (real metrics)
//   7. builds the model leaderboard
// then assembles the honest report: real metrics when the gates pass, otherwise
// Pending with explicit reasons.
import { auditExperimentalLabels } from "../dataAudit/experimentalLabelAudit.js"
import { auditGroundTruth } from "../dataAudit/groundTruthAudit.js"
import { buildBenchmarkSplitV2 } from "./buildBenchmarkSplitV2.js"
import { dataLeakageCheckV3 } from "./dataLeakageCheckV3.js"
import { accuracyEligibilityV2 } from "./accuracyEligibilityV2.js"
import { rocEligibilityV2 } from "./rocEligibilityV2.js"
import { runRealBenchmark, BENCHMARK_MODELS } from "./runRealBenchmark.js"
import { buildModelLeaderboard } from "./modelLeaderboard.js"

const asArray = d => (Array.isArray(d) ? d : Array.isArray(d?.labels) ? d.labels : Array.isArray(d?.records) ? d.records : [])

export function buildFirstRealBenchmarkReport({ experimentalLabels = [], externalTest = [], seed = 7 } = {}) {
  const labels = asArray(experimentalLabels)
  const external = asArray(externalTest)

  const experimentalLabelAudit = auditExperimentalLabels(labels)
  const groundTruthAudit = auditGroundTruth(labels)

  const split = buildBenchmarkSplitV2({ records: labels, externalTest: external, seed })
  // Leakage across all internal splits (catalyst / experiment / DOI). DOI shared
  // only as a warning. The external set is disjoint by construction.
  const leakage = dataLeakageCheckV3({ records: split.records.filter(r => r.split !== "external_test") })

  const externalTestCount = split.counts.external_test
  const accuracyGate = accuracyEligibilityV2({ experimentalLabelAudit, groundTruthAudit, leakage, externalTestCount })
  const rocGate = rocEligibilityV2({ experimentalLabelAudit, groundTruthAudit, leakage, externalTestCount })
  const metricsAllowed = accuracyGate.metricsAllowed && rocGate.metricsAllowed

  const benchmark = runRealBenchmark({
    trainRecords: split.trainRecords,
    validationRecords: split.validationRecords,
    testRecords: split.testRecords,
    externalTestRecords: split.externalTestRecords,
    metricsAllowed,
    models: BENCHMARK_MODELS,
  })
  const leaderboard = buildModelLeaderboard({ benchmark, metricsAllowed })

  const modelRows = benchmark.models.map(m => {
    const ext = metricsAllowed ? m.externalMetrics : null
    return {
      model: m.model,
      status: !benchmark.canRun ? "Blocked" : metricsAllowed ? "Completed" : "Runnable · Pending",
      train: m.trainSize,
      validation: m.validationSize,
      test: m.testSize,
      externalTest: m.externalTestSize,
      accuracy: metricsAllowed && ext ? ext.accuracy : "Pending",
      precision: metricsAllowed && ext ? ext.precision : "Pending",
      recall: metricsAllowed && ext ? ext.recall : "Pending",
      f1: metricsAllowed && ext ? ext.f1 : "Pending",
      rocAuc: metricsAllowed && ext ? ext.rocAuc : "Pending",
    }
  })

  const result = metricsAllowed ? "A" : "B"
  let overallStatus
  if (!benchmark.canRun) overallStatus = "Benchmark Blocked"
  else if (metricsAllowed) overallStatus = "First Real Benchmark Complete"
  else overallStatus = "Benchmark Runnable · Metrics Pending"

  const acceptance = {
    experimentalLabels: experimentalLabelAudit.experimentalLabelCount,
    experimentalLabelsOk: experimentalLabelAudit.experimentalLabelCount >= 30,
    verifiedGroundTruth: groundTruthAudit.verifiedGroundTruthCount,
    verifiedGroundTruthOk: groundTruthAudit.verifiedGroundTruthCount >= 30,
    externalTest: externalTestCount,
    externalTestOk: externalTestCount >= 30,
    leakCount: leakage.leakCount,
    leakOk: leakage.leakCount === 0,
    invalidGroundTruth: groundTruthAudit.invalidGroundTruthCount,
    invalidGroundTruthOk: groundTruthAudit.invalidGroundTruthCount === 0,
    syntheticLabelCount: experimentalLabelAudit.syntheticLabelCount,
    syntheticOk: experimentalLabelAudit.syntheticLabelCount === 0,
    benchmarkReportGenerated: true,
  }

  return {
    reportId: "first-real-benchmark-report-v1",
    version: "v3.4",
    result, // "A" = metrics shown, "B" = Pending
    overallStatus,
    metricsAllowed,
    experimentalLabelAudit,
    groundTruthAudit,
    split: { counts: split.counts, ratios: split.ratios, complete: split.complete, groupCount: split.groupCount },
    leakage: { leakCount: leakage.leakCount, leakSeverity: leakage.leakSeverity, ok: leakage.ok, sharedDoiWarnings: leakage.sharedDoiWarnings },
    accuracyGate,
    rocGate,
    models: modelRows,
    leaderboard,
    pendingReasons: metricsAllowed ? [] : accuracyGate.reasons,
    acceptance,
    answers: {
      hasRealExperimentalLabels: experimentalLabelAudit.experimentalLabelCount > 0,
      groundTruthTrustworthy: groundTruthAudit.invalidGroundTruthCount === 0 && groundTruthAudit.verifiedGroundTruthCount > 0,
      externalTestSufficient: externalTestCount >= 30,
      benchmarkRunnable: benchmark.canRun,
      accuracyAllowed: accuracyGate.metricsAllowed,
      rocAllowed: rocGate.metricsAllowed,
      bestModel: leaderboard.bestModel,
    },
  }
}

export default buildFirstRealBenchmarkReport
