// @ts-nocheck
// V3.6 Model Robustness Report — the end-to-end robustness program on the
// EXPANDED experimental-label benchmark. It fits the three models, runs a fresh
// real benchmark, then layers cross-validation V2 (5/10/repeated), bootstrap
// validation, 95% confidence intervals, a generalization audit, stability V2,
// repeated-CV ranking, a reliability score, and credibility V2. Every metric is
// a real training output — answering "is the result robust, not a fluke?".
import { featureVector } from "../dataIngestion/experimentalLabelDataset.js"
import { MODEL_TRAINERS, computeMetrics } from "./mlModels.js"
import { BENCHMARK_MODELS } from "./runRealBenchmark.js"
import { buildBenchmarkSplitV2 } from "./buildBenchmarkSplitV2.js"
import { dataLeakageCheckV3 } from "./dataLeakageCheckV3.js"
import { runCrossValidationV2, repeatedCrossValidation } from "./crossValidationRunnerV2.js"
import { buildRepeatedCvRanking } from "./repeatedCvRanking.js"
import { bootstrapValidation } from "./bootstrapValidation.js"
import { confidenceIntervalAnalysis } from "./confidenceIntervalAnalysis.js"
import { generalizationAudit } from "./generalizationAudit.js"
import { auditModelStabilityV2 } from "./modelStabilityAuditV2.js"
import { calculateModelReliability } from "./modelReliability.js"
import { buildFeatureAblationStudy } from "./featureAblationStudy.js"
import { calculateModelCredibilityV2 } from "./calculateModelCredibilityV2.js"
import { auditGroundTruth } from "../dataAudit/groundTruthAudit.js"
import { auditExperimentalLabels } from "../dataAudit/experimentalLabelAudit.js"

const asArray = d => (Array.isArray(d) ? d : Array.isArray(d?.labels) ? d.labels : Array.isArray(d?.records) ? d.records : [])
const encodeY = records => records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0))

export function buildModelRobustnessReport({ experimentalLabels = [], externalTest = [], repeats = 5, bootstrapIterations = 1000, seed = 7 } = {}) {
  const labels = asArray(experimentalLabels)
  const external = asArray(externalTest)

  const split = buildBenchmarkSplitV2({ records: labels, externalTest: external, seed })
  const trainX = split.trainRecords.map(featureVector)
  const trainY = encodeY(split.trainRecords)
  const fitted = Object.fromEntries(BENCHMARK_MODELS.map(name => [name, MODEL_TRAINERS[name](trainX, trainY)]))

  // Fresh real benchmark metrics on the external test (the honest estimate).
  const extX = split.externalTestRecords.map(featureVector)
  const extY = encodeY(split.externalTestRecords)
  const benchmark = BENCHMARK_MODELS.map(name => {
    const proba = fitted[name].predictProba(extX)
    const m = computeMetrics(extY, proba)
    return { model: name, accuracy: m.accuracy, precision: m.precision, recall: m.recall, f1: m.f1, rocAuc: m.rocAuc, proba }
  })
  const bestRow = [...benchmark].sort((a, b) => (b.rocAuc ?? 0) - (a.rocAuc ?? 0) || b.f1 - a.f1)[0]
  const bestModel = bestRow.model

  // Cross validation V2 + repeated-CV ranking.
  const crossValidationV2 = runCrossValidationV2({ records: labels, repeats, seed })
  const repeatedRanking = buildRepeatedCvRanking({ records: labels, folds: 5, repeats, seed })
  const repeatedBest = crossValidationV2.repeatedFiveFold.models.find(m => m.model === bestModel) || {}

  // Bootstrap on the best model's external predictions + 95% CIs.
  const bootstrap = bootstrapValidation({ yTrue: extY, yScore: bestRow.proba, iterations: bootstrapIterations, seed: 99 })
  const ci = confidenceIntervalAnalysis({ distributions: bootstrap.distributions, level: 0.95 })

  // Generalization audit + stability V2 + reliability.
  const generalization = generalizationAudit({ model: fitted[bestModel], modelName: bestModel, trainRecords: split.trainRecords, validationRecords: split.validationRecords, testRecords: split.testRecords, externalTestRecords: split.externalTestRecords })
  const stabilityV2 = auditModelStabilityV2({ repeatedCv: crossValidationV2.repeatedFiveFold, bestModel, bootstrap, generalization })
  const externalMetrics = { accuracy: bestRow.accuracy, rocAuc: bestRow.rocAuc }
  const reliability = calculateModelReliability({ repeatedCvBest: repeatedBest, bootstrapSummary: bootstrap.summary, generalization, externalMetrics })

  // Credibility V2.
  const ablation = buildFeatureAblationStudy({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: bestModel })
  const groundTruth = auditGroundTruth(labels)
  const expAudit = auditExperimentalLabels(labels)
  const leakage = dataLeakageCheckV3({ records: split.records.filter(r => r.split !== "external_test") })
  const credibilityV2 = calculateModelCredibilityV2({
    benchmark: { rocAuc: bestRow.rocAuc, accuracy: bestRow.accuracy },
    crossValidation: { rocMean: repeatedBest.rocMean, accuracyMean: repeatedBest.accuracyMean },
    stability: { coefficientOfVariation: repeatedBest.accuracyMean ? repeatedBest.accuracyStd / repeatedBest.accuracyMean : 1 },
    ablation,
    dataQuality: { verifiedGroundTruth: groundTruth.verifiedGroundTruthCount, invalidGroundTruth: groundTruth.invalidGroundTruthCount, externalTestCount: split.counts.external_test, leakCount: leakage.leakCount, syntheticLabelCount: expAudit.syntheticLabelCount },
    confidenceInterval: ci,
    generalization,
    bootstrap: bootstrap.summary,
  })

  // Strip the heavy proba arrays from the serialized benchmark rows.
  const benchmarkRows = benchmark.map(({ proba, ...row }) => row)

  return {
    reportId: "model-robustness-report-v1",
    version: "v3.6",
    datasetSize: { experimentalLabels: labels.length, externalTest: external.length, train: split.trainRecords.length, validation: split.validationRecords.length, test: split.testRecords.length },
    bestModel,
    benchmark: benchmarkRows,
    crossValidation: crossValidationV2,
    repeatedRanking,
    bootstrap: { iterations: bootstrap.iterations, n: bootstrap.n, summary: bootstrap.summary },
    confidenceInterval: ci,
    generalization,
    stability: stabilityV2,
    reliability,
    credibility: credibilityV2,
    leakage: { leakCount: leakage.leakCount, ok: leakage.ok },
    answers: {
      enoughExperimentalLabels: labels.length >= 100,
      enoughExternalTest: external.length >= 60,
      accuracyStable: stabilityV2.bootstrapStability === "Stable" || stabilityV2.bootstrapStability === "Moderately Stable",
      rocStable: (bootstrap.summary.rocAuc?.std ?? 1) < 0.1,
      overfitting: generalization.overfittingRisk,
      bestLongRunModel: repeatedRanking.bestModel,
      credibilityImproved: credibilityV2.score,
      biggestStatisticalRisk: external.length < 100 ? "External test still modest; wide bootstrap CIs and limited fold count keep variance high." : "Label corpus below industrial scale.",
    },
  }
}

export default buildModelRobustnessReport
