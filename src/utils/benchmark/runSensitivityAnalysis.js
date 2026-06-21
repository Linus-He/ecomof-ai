// @ts-nocheck
// V3.5 Sensitivity Analysis — drop one feature, retrain the model on the V3.4
// train split, re-evaluate on the held-out set, and measure the performance
// drop. Answers "which features actually drive the result". Real retraining;
// the V3.4 benchmark numbers are untouched (this is a parallel diagnostic).
import { featureVector, FEATURE_KEYS } from "../dataIngestion/experimentalLabelDataset.js"
import { MODEL_TRAINERS, computeMetrics } from "./mlModels.js"
import { FEATURE_LABELS } from "./featureImportance.js"

const r4 = v => Number(Number(v).toFixed(4))
const encodeY = records => records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0))

// Drop column `dropIndex` from every feature vector (null = keep all).
function matrix(records, dropIndex = null) {
  return records.map(r => featureVector(r).filter((_, i) => i !== dropIndex))
}

export function runSensitivityAnalysis({ trainRecords = [], evalRecords = [], modelName = "Random Forest", featureKeys = FEATURE_KEYS } = {}) {
  const yTrain = encodeY(trainRecords)
  const yEval = encodeY(evalRecords)
  const trainer = MODEL_TRAINERS[modelName]
  if (!trainer || new Set(yTrain).size < 2 || !evalRecords.length) {
    return { model: modelName, baseline: null, features: [], note: "Insufficient data to run sensitivity analysis." }
  }

  const baseModel = trainer(matrix(trainRecords), yTrain)
  const baseMetrics = computeMetrics(yEval, baseModel.predictProba(matrix(evalRecords)))

  const features = featureKeys.map((key, i) => {
    const model = trainer(matrix(trainRecords, i), yTrain)
    const m = computeMetrics(yEval, model.predictProba(matrix(evalRecords, i)))
    return {
      feature: key,
      label: FEATURE_LABELS[key] || key,
      accuracyWithout: m.accuracy,
      rocWithout: m.rocAuc,
      accuracyDrop: r4(baseMetrics.accuracy - m.accuracy),
      rocDrop: m.rocAuc != null && baseMetrics.rocAuc != null ? r4(baseMetrics.rocAuc - m.rocAuc) : null,
    }
  }).sort((a, b) => b.accuracyDrop - a.accuracyDrop)

  return {
    analysisId: "sensitivity-analysis-v1",
    model: modelName,
    evalSize: evalRecords.length,
    baseline: { accuracy: baseMetrics.accuracy, rocAuc: baseMetrics.rocAuc },
    features,
    note: "Each feature is removed, the model retrained, and the drop in held-out accuracy / ROC measured. Larger drop = more important.",
  }
}

export default runSensitivityAnalysis
