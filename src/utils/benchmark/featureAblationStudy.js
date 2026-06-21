// @ts-nocheck
// V3.5 Feature Ablation Study — classifies each feature as Critical / Useful /
// Marginal from the sensitivity-analysis drops. Built on runSensitivityAnalysis,
// so it retrains on the V3.4 train split and never alters the benchmark result.
import { runSensitivityAnalysis } from "./runSensitivityAnalysis.js"

export function classifyAblation(accuracyDrop = 0, rocDrop = 0) {
  const drop = Math.max(accuracyDrop, rocDrop || 0)
  if (drop >= 0.05) return "Critical"
  if (drop >= 0.01) return "Useful"
  return "Marginal"
}

export function buildFeatureAblationStudy({ trainRecords = [], evalRecords = [], modelName = "Random Forest", featureKeys } = {}) {
  const sensitivity = runSensitivityAnalysis({ trainRecords, evalRecords, modelName, featureKeys })
  const rows = (sensitivity.features || []).map(f => ({
    feature: f.feature,
    label: f.label,
    accuracyChange: f.accuracyDrop,
    rocChange: f.rocDrop,
    classification: classifyAblation(f.accuracyDrop, f.rocDrop || 0),
  }))
  const tally = rows.reduce((acc, r) => { acc[r.classification] = (acc[r.classification] || 0) + 1; return acc }, { Critical: 0, Useful: 0, Marginal: 0 })
  return {
    studyId: "feature-ablation-study-v1",
    model: modelName,
    baseline: sensitivity.baseline,
    rows,
    tally,
    criticalFeatures: rows.filter(r => r.classification === "Critical").map(r => r.label),
    note: "Removing a Critical feature drops held-out accuracy/ROC by ≥0.05; Useful ≥0.01; Marginal below that.",
  }
}

export default buildFeatureAblationStudy
