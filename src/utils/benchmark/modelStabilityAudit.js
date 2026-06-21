// @ts-nocheck
// V3.5 Model Stability Audit — turns cross-validation fold variance into a
// stability verdict (Stable / Moderately Stable / Unstable) per model, using
// variance, standard deviation, and the coefficient of variation of fold accuracy.
const r4 = v => Number(Number(v).toFixed(4))

export function classifyStability(cv) {
  // Coefficient of variation thresholds (lower = more stable).
  if (cv <= 0.1) return "Stable"
  if (cv <= 0.2) return "Moderately Stable"
  return "Unstable"
}

export function auditModelStability(crossValidation = {}) {
  const models = Array.isArray(crossValidation.models) ? crossValidation.models : []
  const rows = models.map(m => {
    const accuracies = (m.folds || []).filter(f => f.accuracy != null).map(f => f.accuracy)
    const meanAcc = accuracies.length ? accuracies.reduce((a, v) => a + v, 0) / accuracies.length : 0
    const variance = accuracies.length ? accuracies.reduce((a, v) => a + (v - meanAcc) ** 2, 0) / accuracies.length : 0
    const sd = Math.sqrt(variance)
    const cv = meanAcc ? sd / meanAcc : 1
    return {
      model: m.model,
      meanAccuracy: r4(meanAcc),
      variance: r4(variance),
      std: r4(sd),
      coefficientOfVariation: r4(cv),
      stability: classifyStability(cv),
      stabilityScore: m.stabilityScore ?? r4(Math.max(0, 1 - cv)),
    }
  })
  const worst = rows.reduce((acc, r) => Math.max(acc, r.coefficientOfVariation), 0)
  return {
    auditId: "model-stability-audit",
    k: crossValidation.k || null,
    rows,
    overallStability: classifyStability(worst),
    note: "Stability is judged from the coefficient of variation of cross-validation fold accuracy. Small experimental-label sets naturally show higher variance.",
  }
}

export default auditModelStability
