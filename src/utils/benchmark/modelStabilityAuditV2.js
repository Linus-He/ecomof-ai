// @ts-nocheck
// V3.6 Model Stability Audit V2 — combines three independent stability views:
//   - Cross Validation Stability (variance across repeated-CV folds)
//   - Bootstrap Stability        (variance across bootstrap resamples)
//   - External Test Stability    (train→external generalization gap)
// into one verdict (Stable / Moderately Stable / Unstable) per axis + overall.
import { classifyStability } from "./modelStabilityAudit.js"

const RANK = { Stable: 0, "Moderately Stable": 1, Unstable: 2 }
const worst = levels => levels.reduce((acc, l) => (RANK[l] > RANK[acc] ? l : acc), "Stable")
const cvOf = (mean, std) => (mean ? std / mean : 1)

export function auditModelStabilityV2({ repeatedCv = {}, bestModel = "Random Forest", bootstrap = null, generalization = null } = {}) {
  const models = Array.isArray(repeatedCv.models) ? repeatedCv.models : []

  const rows = models.map(m => {
    const cv = cvOf(m.accuracyMean, m.accuracyStd)
    return {
      model: m.model,
      crossValidationStability: classifyStability(cv),
      cvCoefficientOfVariation: Number(cv.toFixed(4)),
      accuracyMean: m.accuracyMean,
      accuracyStd: m.accuracyStd,
    }
  })

  // Bootstrap + external stability are computed for the best model.
  let bootstrapStability = "Unknown"
  if (bootstrap?.summary?.accuracy) {
    const bcv = cvOf(bootstrap.summary.accuracy.mean, bootstrap.summary.accuracy.std)
    bootstrapStability = classifyStability(bcv)
  }
  let externalTestStability = "Unknown"
  if (generalization?.generalizationGap != null) {
    const gap = generalization.generalizationGap
    externalTestStability = gap <= 0.1 ? "Stable" : gap <= 0.2 ? "Moderately Stable" : "Unstable"
  }
  const bestRow = rows.find(r => r.model === bestModel) || rows[0] || {}
  const axes = [bestRow.crossValidationStability, bootstrapStability, externalTestStability].filter(l => l && l !== "Unknown")
  const overall = axes.length ? worst(axes) : "Unknown"

  return {
    auditId: "model-stability-audit-v2",
    bestModel,
    rows,
    crossValidationStability: bestRow.crossValidationStability || "Unknown",
    bootstrapStability,
    externalTestStability,
    overallStability: overall,
    note: "Overall stability is the worst of cross-validation, bootstrap, and external-test stability for the best model.",
  }
}

export default auditModelStabilityV2
