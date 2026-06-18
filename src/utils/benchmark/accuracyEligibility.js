// @ts-nocheck
// V3.2 Accuracy Gate — Accuracy / Precision / Recall / F1 may only be shown when
// there are real (independently-measured experimental) labels, a real split, and
// no data leakage. Otherwise the status is Pending with explicit reasons.
// Dataset-derived labels are NOT accepted as real experimental ground truth.

export function accuracyEligibility({ labelAudit = {}, leakage = {}, split = {}, benchmarkEligibleConfirmed = 0 } = {}) {
  const reasons = []

  const hasRealLabels = Number(labelAudit.realExperimentalLabelCount || 0) > 0
  if (!hasRealLabels) {
    reasons.push("No independently-measured experimental labels (current labels are dataset-derived).")
  }
  if (Number(labelAudit.invalidGroundTruthCount || 0) > 0) {
    reasons.push("Algorithm-generated labels cannot be used as ground truth.")
  }
  const splitComplete = Boolean(split.complete) && Number(split.counts?.train || 0) > 0 && Number(split.counts?.test || 0) > 0
  if (!splitComplete) reasons.push("Train/test split is incomplete.")
  if (!leakage.ok) reasons.push(`Data leakage detected (${leakage.leakCount || 0} leaks).`)
  if (Number(benchmarkEligibleConfirmed) < 100) reasons.push("Confirmed benchmark-eligible records below 100.")

  const eligible = reasons.length === 0
  return {
    metric: "accuracy",
    eligible,
    status: eligible ? "Ready" : "Pending",
    metricsAllowed: eligible,
    metrics: eligible ? null : { accuracy: "Pending", precision: "Pending", recall: "Pending", f1: "Pending" },
    reasons,
  }
}

export default accuracyEligibility
