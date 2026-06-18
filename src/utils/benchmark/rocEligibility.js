// @ts-nocheck
// V3.2 ROC-AUC Gate — same conditions as the Accuracy Gate. ROC-AUC stays
// Pending unless real experimental labels, a real split, and zero leakage exist.
import { accuracyEligibility } from "./accuracyEligibility.js"

export function rocEligibility({ labelAudit = {}, leakage = {}, split = {}, benchmarkEligibleConfirmed = 0 } = {}) {
  const base = accuracyEligibility({ labelAudit, leakage, split, benchmarkEligibleConfirmed })
  return {
    metric: "roc_auc",
    eligible: base.eligible,
    status: base.status,
    metricsAllowed: base.metricsAllowed,
    metrics: base.eligible ? null : { rocAuc: "Pending" },
    reasons: base.reasons,
  }
}

export default rocEligibility
