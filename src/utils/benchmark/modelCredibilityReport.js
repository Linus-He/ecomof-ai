// @ts-nocheck
// V3.5 Model Credibility Report — the end-to-end credibility/explainability
// program. It REBUILDS the exact V3.4 split + models (deterministic, identical
// to V3.4), then layers explainability, feature importance, 5- & 10-fold cross
// validation, stability, sensitivity, ablation, a benchmark-credibility audit,
// and a 0–100 credibility score. It reads the frozen V3.4 benchmark numbers and
// never alters them.
import { featureVector, FEATURE_KEYS } from "../dataIngestion/experimentalLabelDataset.js"
import { MODEL_TRAINERS } from "./mlModels.js"
import { BENCHMARK_MODELS } from "./runRealBenchmark.js"
import { buildBenchmarkSplitV2 } from "./buildBenchmarkSplitV2.js"
import { buildFeatureImportance } from "./featureImportance.js"
import { buildModelExplainability } from "./modelExplainability.js"
import { runCrossValidation } from "./crossValidationRunner.js"
import { auditModelStability } from "./modelStabilityAudit.js"
import { runSensitivityAnalysis } from "./runSensitivityAnalysis.js"
import { buildFeatureAblationStudy } from "./featureAblationStudy.js"
import { calculateModelCredibility } from "./calculateModelCredibility.js"
import { auditBenchmarkCredibility } from "./benchmarkCredibilityAudit.js"

const asArray = d => (Array.isArray(d) ? d : Array.isArray(d?.labels) ? d.labels : Array.isArray(d?.records) ? d.records : [])
const encodeY = records => records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0))

export function buildModelCredibilityReport({ experimentalLabels = [], externalTest = [], firstBenchmark = {}, seed = 7 } = {}) {
  const labels = asArray(experimentalLabels)
  const external = asArray(externalTest)

  // Rebuild the V3.4 split + fit the same models (identical, deterministic).
  const split = buildBenchmarkSplitV2({ records: labels, externalTest: external, seed })
  const trainX = split.trainRecords.map(featureVector)
  const trainY = encodeY(split.trainRecords)
  const fitted = {}
  for (const name of BENCHMARK_MODELS) fitted[name] = MODEL_TRAINERS[name](trainX, trainY)

  // The external test is the headline evaluation set the V3.4 ROC came from.
  const evalRecords = split.externalTestRecords

  // Feature importance (per model) + explainability.
  const featureImportance = BENCHMARK_MODELS.map(name => ({ model: name, ...buildFeatureImportance({ model: fitted[name], records: evalRecords }) }))
  const explainability = buildModelExplainability({ fitted, evalRecords, sampleRecord: evalRecords[0] })

  // Cross validation: 5-fold and 10-fold over the full experimental-label set.
  const cv5 = runCrossValidation({ records: labels, folds: 5 })
  const cv10 = runCrossValidation({ records: labels, folds: 10 })
  const stability5 = auditModelStability(cv5)
  const stability10 = auditModelStability(cv10)

  // Sensitivity + ablation for the best model from the V3.4 leaderboard.
  const bestModel = firstBenchmark?.leaderboard?.bestModel || "Random Forest"
  const sensitivity = runSensitivityAnalysis({ trainRecords: split.trainRecords, evalRecords, modelName: bestModel })
  const ablation = buildFeatureAblationStudy({ trainRecords: split.trainRecords, evalRecords, modelName: bestModel })

  // Benchmark credibility audit + credibility score.
  const benchmarkCredibilityAudit = auditBenchmarkCredibility({ firstBenchmark, crossValidation: cv5 })
  const bestBenchmarkRow = (firstBenchmark.models || []).find(m => m.model === bestModel) || {}
  const bestCv5 = cv5.models.find(m => m.model === bestModel) || {}
  const bestStability5 = stability5.rows.find(r => r.model === bestModel) || {}
  const credibility = calculateModelCredibility({
    benchmark: { rocAuc: typeof bestBenchmarkRow.rocAuc === "number" ? bestBenchmarkRow.rocAuc : null, accuracy: typeof bestBenchmarkRow.accuracy === "number" ? bestBenchmarkRow.accuracy : null },
    crossValidation: { rocMean: bestCv5.rocMean, accuracyMean: bestCv5.accuracyMean },
    stability: { coefficientOfVariation: bestStability5.coefficientOfVariation },
    ablation,
    dataQuality: {
      verifiedGroundTruth: firstBenchmark.groundTruthAudit?.verifiedGroundTruthCount,
      invalidGroundTruth: firstBenchmark.groundTruthAudit?.invalidGroundTruthCount,
      externalTestCount: split.counts.external_test,
      leakCount: firstBenchmark.leakage?.leakCount,
      syntheticLabelCount: firstBenchmark.experimentalLabelAudit?.syntheticLabelCount,
    },
  })

  return {
    reportId: "model-credibility-report-v1",
    version: "v3.5",
    bestModel,
    benchmarkSource: "first_real_benchmark_report_v1.json (V3.4, frozen)",
    featureImportance,
    explainability,
    crossValidation: { fiveFold: cv5, tenFold: cv10 },
    stability: { fiveFold: stability5, tenFold: stability10 },
    sensitivity,
    ablation,
    benchmarkCredibilityAudit,
    credibility,
    answers: {
      whyRandomForestFirst: explainability.whyRandomForestFirst,
      mostImportantFeatures: (featureImportance.find(f => f.model === bestModel)?.rows || []).slice(0, 3).map(r => r.label),
      stable: bestStability5.stability,
      overfittingRisk: bestStability5.coefficientOfVariation > 0.2 ? "Elevated (high CV variance on a small set)" : "Moderate (small dataset; gap between CV and external test monitored)",
      drivingFeatures: ablation.criticalFeatures,
      credibilityScore: credibility.score,
      credibilityGrade: credibility.grade,
      biggestLimitation: "Experimental-label corpus is small (40 labels); credibility is data-limited, not model-limited.",
    },
  }
}

export default buildModelCredibilityReport
