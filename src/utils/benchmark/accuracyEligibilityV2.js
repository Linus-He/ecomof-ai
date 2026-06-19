// @ts-nocheck
// V3.4 Accuracy Gate (V2) — Accuracy / Precision / Recall / F1 may be shown only
// when ALL of the following hold:
//   - Experimental Labels   ≥ 20
//   - Ground Truth Verified  (verified > 0 and 0 invalid/algorithm-generated)
//   - Data Leakage = 0
//   - External Test         ≥ 20
// Otherwise every metric stays Pending with explicit, honest reasons.
export const ACCURACY_THRESHOLDS = { experimentalLabels: 20, externalTest: 20 }

export function accuracyEligibilityV2({ experimentalLabelAudit = {}, groundTruthAudit = {}, leakage = {}, externalTestCount = 0 } = {}) {
  const experimentalLabelCount = Number(experimentalLabelAudit.experimentalLabelCount || 0)
  const syntheticLabelCount = Number(experimentalLabelAudit.syntheticLabelCount || 0)
  const verifiedGroundTruthCount = Number(groundTruthAudit.verifiedGroundTruthCount || 0)
  const invalidGroundTruthCount = Number(groundTruthAudit.invalidGroundTruthCount || 0)
  const leakCount = Number(leakage.leakCount || 0)
  const external = Number(externalTestCount || 0)

  const conditions = {
    experimentalLabels: experimentalLabelCount >= ACCURACY_THRESHOLDS.experimentalLabels,
    groundTruthVerified: verifiedGroundTruthCount > 0 && invalidGroundTruthCount === 0,
    leakageZero: leakCount === 0 && leakage.ok !== false,
    externalTest: external >= ACCURACY_THRESHOLDS.externalTest,
    noSyntheticLabels: syntheticLabelCount === 0,
  }

  const reasons = []
  if (!conditions.experimentalLabels) reasons.push(`Experimental labels below ${ACCURACY_THRESHOLDS.experimentalLabels} (have ${experimentalLabelCount}).`)
  if (!conditions.groundTruthVerified) reasons.push(`Ground truth not fully verified (verified ${verifiedGroundTruthCount}, invalid ${invalidGroundTruthCount}).`)
  if (!conditions.leakageZero) reasons.push(`Data leakage present (${leakCount} leaks).`)
  if (!conditions.externalTest) reasons.push(`External test below ${ACCURACY_THRESHOLDS.externalTest} (have ${external}).`)
  if (!conditions.noSyntheticLabels) reasons.push(`Synthetic labels present (${syntheticLabelCount}); forbidden.`)

  const eligible = reasons.length === 0
  return {
    metric: "accuracy",
    eligible,
    status: eligible ? "Ready" : "Pending",
    metricsAllowed: eligible,
    conditions,
    reasons,
    metrics: eligible ? null : { accuracy: "Pending", precision: "Pending", recall: "Pending", f1: "Pending" },
  }
}

export default accuracyEligibilityV2
