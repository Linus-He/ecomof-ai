// @ts-nocheck
// V3.5 Feature Importance — model-agnostic permutation importance computed from
// the REAL fitted V3.4 models (no benchmark result is changed). For each feature
// the column is shuffled and the drop in accuracy is measured; the bigger the
// drop, the more the model relies on that feature. Deterministic (seeded).
import { featureVector, FEATURE_KEYS } from "../dataIngestion/experimentalLabelDataset.js"
import { computeMetrics } from "./mlModels.js"

// Human-readable labels for the actual model features (V3.4 used these six —
// importances are reported only for features the model was really trained on).
export const FEATURE_LABELS = {
  temperature: "Temperature",
  pressure: "Pressure",
  reactionTime: "Reaction Time",
  metalElectronegativity: "Metal Node (electronegativity)",
  surfaceArea: "Surface Area",
  voidFraction: "Void Fraction",
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function shuffledColumn(X, col, rand) {
  const values = X.map(row => row[col])
  for (let i = values.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [values[i], values[j]] = [values[j], values[i]] }
  return X.map((row, i) => row.map((v, c) => (c === col ? values[i] : v)))
}

// Permutation importance for one fitted model over an evaluation set.
export function permutationImportance({ model, X, y, repeats = 12, seed = 21 } = {}) {
  if (!X.length) return []
  const baseline = computeMetrics(y, model.predictProba(X)).accuracy
  const d = X[0].length
  const rand = mulberry32(seed)
  const out = []
  for (let c = 0; c < d; c += 1) {
    const drops = []
    for (let r = 0; r < repeats; r += 1) {
      const permuted = shuffledColumn(X, c, rand)
      drops.push(baseline - computeMetrics(y, model.predictProba(permuted)).accuracy)
    }
    const mean = drops.reduce((a, v) => a + v, 0) / drops.length
    const variance = drops.reduce((a, v) => a + (v - mean) ** 2, 0) / drops.length
    out.push({ index: c, importance: Number(Math.max(0, mean).toFixed(4)), importanceStd: Number(Math.sqrt(variance).toFixed(4)) })
  }
  return out
}

// Builds a ranked, UI-ready feature-importance table for one model.
export function buildFeatureImportance({ model, records = [], featureKeys = FEATURE_KEYS, repeats = 12, seed = 21 } = {}) {
  const X = records.map(featureVector)
  const y = records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0))
  const raw = permutationImportance({ model, X, y, repeats, seed })
  const total = raw.reduce((a, v) => a + v.importance, 0) || 1
  const rows = raw
    .map(r => ({
      feature: featureKeys[r.index],
      label: FEATURE_LABELS[featureKeys[r.index]] || featureKeys[r.index],
      importance: r.importance,
      importanceStd: r.importanceStd,
      contribution: Number((r.importance / total).toFixed(4)),
    }))
    .sort((a, b) => b.importance - a.importance)
  rows.forEach((r, i) => { r.rank = i + 1 })
  return { method: "permutation_importance", evalSize: records.length, rows, source: "first_real_benchmark_report_v1 (V3.4 models, frozen)" }
}

export default buildFeatureImportance
