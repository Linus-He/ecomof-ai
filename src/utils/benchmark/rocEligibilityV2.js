// @ts-nocheck
// V3.4 ROC-AUC Gate (V2) — identical conditions to the Accuracy Gate. ROC-AUC is
// shown only when experimental labels ≥ 20, ground truth verified, leakage = 0,
// and external test ≥ 20; otherwise it stays Pending with the same reasons.
import { accuracyEligibilityV2 } from "./accuracyEligibilityV2.js"

export function rocEligibilityV2({ experimentalLabelAudit = {}, groundTruthAudit = {}, leakage = {}, externalTestCount = 0 } = {}) {
  const base = accuracyEligibilityV2({ experimentalLabelAudit, groundTruthAudit, leakage, externalTestCount })
  return {
    metric: "roc_auc",
    eligible: base.eligible,
    status: base.status,
    metricsAllowed: base.metricsAllowed,
    conditions: base.conditions,
    reasons: base.reasons,
    metrics: base.eligible ? null : { rocAuc: "Pending" },
  }
}

export default rocEligibilityV2
