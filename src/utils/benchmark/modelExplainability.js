// @ts-nocheck
// V3.5 Model Explainability — explains the three frozen V3.4 models:
//   - Logistic Regression: standardized coefficients → positive / negative contributions
//   - Decision Tree: a decision path + per-feature split importance (split counts)
//   - Random Forest: permutation feature importance + tree-consensus score
// Nothing here changes any benchmark result; it interprets the fitted models.
import { featureVector, FEATURE_KEYS } from "../dataIngestion/experimentalLabelDataset.js"
import { FEATURE_LABELS, buildFeatureImportance } from "./featureImportance.js"

const label = key => FEATURE_LABELS[key] || key

// ---- Logistic Regression: standardized coefficients are comparable importances ----
export function explainLogistic(model, featureKeys = FEATURE_KEYS) {
  const weights = model.weights || []
  const rows = weights.map((w, i) => ({ feature: featureKeys[i], label: label(featureKeys[i]), coefficient: Number(w.toFixed(4)), absCoefficient: Number(Math.abs(w).toFixed(4)), direction: w >= 0 ? "positive" : "negative" }))
    .sort((a, b) => b.absCoefficient - a.absCoefficient)
  return {
    model: "Logistic Regression",
    bias: Number((model.bias || 0).toFixed(4)),
    coefficients: rows,
    positiveContributions: rows.filter(r => r.direction === "positive"),
    negativeContributions: rows.filter(r => r.direction === "negative"),
    note: "Coefficients are on standardized features, so their magnitudes are directly comparable as feature weights.",
  }
}

// ---- Decision Tree: traverse the tree for a path + count splits per feature ----
function splitCounts(node, counts) {
  if (!node || node.leaf) return
  counts[node.feature] = (counts[node.feature] || 0) + 1
  splitCounts(node.left, counts)
  splitCounts(node.right, counts)
}
function decisionPath(node, row, featureKeys, path = []) {
  if (!node || node.leaf) { if (node) path.push({ leaf: true, proba: Number(node.proba.toFixed(4)) }); return path }
  const goLeft = row[node.feature] <= node.threshold
  path.push({ feature: featureKeys[node.feature], label: label(featureKeys[node.feature]), threshold: Number(node.threshold.toFixed(3)), value: Number(row[node.feature].toFixed(3)), direction: goLeft ? "<=" : ">" })
  return decisionPath(goLeft ? node.left : node.right, row, featureKeys, path)
}
export function explainDecisionTree(model, { sampleRecord = null, featureKeys = FEATURE_KEYS } = {}) {
  const counts = {}
  splitCounts(model.root, counts)
  const totalSplits = Object.values(counts).reduce((a, v) => a + v, 0) || 1
  const splitImportance = featureKeys
    .map((k, i) => ({ feature: k, label: label(k), splits: counts[i] || 0, importance: Number(((counts[i] || 0) / totalSplits).toFixed(4)) }))
    .sort((a, b) => b.splits - a.splits)
  const path = sampleRecord ? decisionPath(model.root, featureVector(sampleRecord), featureKeys) : []
  return { model: "Decision Tree", totalSplits, splitImportance, decisionPath: path }
}

// ---- Random Forest: permutation importance + ensemble consensus ----
// Tree consensus = how decisively the ensemble votes (probabilities near 0/1
// mean high agreement). Derived from predictProba (no per-tree internals needed).
export function explainRandomForest(model, { records = [], featureKeys = FEATURE_KEYS, repeats = 12, seed = 21 } = {}) {
  const importance = buildFeatureImportance({ model, records, featureKeys, repeats, seed })
  const X = records.map(featureVector)
  const probas = X.length ? model.predictProba(X) : []
  const consensus = probas.length ? probas.reduce((a, p) => a + Math.abs(p - 0.5) * 2, 0) / probas.length : 0
  return {
    model: "Random Forest",
    trees: model.trees || null,
    featureImportance: importance.rows,
    treeConsensus: Number(consensus.toFixed(4)),
    consensusLevel: consensus >= 0.6 ? "High" : consensus >= 0.35 ? "Moderate" : "Low",
  }
}

// Combined explainability for the Model Explainability Center. `fitted` is a map
// of model name -> fitted model; `evalRecords` is the held-out evaluation set.
export function buildModelExplainability({ fitted = {}, evalRecords = [], sampleRecord = null, featureKeys = FEATURE_KEYS, repeats = 12, seed = 21 } = {}) {
  return {
    explainabilityId: "model-explainability-v1",
    logisticRegression: fitted["Logistic Regression"] ? explainLogistic(fitted["Logistic Regression"], featureKeys) : null,
    decisionTree: fitted["Decision Tree"] ? explainDecisionTree(fitted["Decision Tree"], { sampleRecord: sampleRecord || evalRecords[0], featureKeys }) : null,
    randomForest: fitted["Random Forest"] ? explainRandomForest(fitted["Random Forest"], { records: evalRecords, featureKeys, repeats, seed }) : null,
    whyRandomForestFirst: "Random Forest tops the V3.4 external-test ROC-AUC by averaging many decorrelated trees (bagging + feature subsampling), which lowers variance versus a single Decision Tree and captures non-linear feature interactions a single Logistic Regression cannot.",
  }
}

export default buildModelExplainability
