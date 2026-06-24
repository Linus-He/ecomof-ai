import { buildFamilyFairnessAudit } from "./familyAudit.js"
import { buildProxyValidityAudit } from "./proxyValidity.js"

export { buildFamilyFairnessAudit } from "./familyAudit.js"
export { buildProxyValidityAudit, spearmanCorrelation } from "./proxyValidity.js"

export function buildOrganicAcidAudit(datasets = {}) {
  return {
    version: "V3.9.8",
    generatedAt: "runtime",
    proxyValidity: buildProxyValidityAudit(datasets),
    familyFairness: buildFamilyFairnessAudit(datasets),
    scoringMutation: {
      applied: false,
      note: "Audit conclusions do not silently change the locked spec-v2 weights.",
    },
  }
}
