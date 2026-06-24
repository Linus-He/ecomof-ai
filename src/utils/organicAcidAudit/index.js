import { buildFamilyFairnessAudit } from "./familyAudit.js"
import { buildProxyValidityAudit } from "./proxyValidity.js"

export { buildFamilyFairnessAudit } from "./familyAudit.js"
export { buildProxyValidityAudit, spearmanCorrelation } from "./proxyValidity.js"

export function buildOrganicAcidAudit(datasets = {}) {
  return {
    version: "V3.9.7",
    generatedAt: "runtime",
    proxyValidity: buildProxyValidityAudit(datasets),
    familyFairness: buildFamilyFairnessAudit(datasets),
    scoringMutation: {
      applied: false,
      note: "Stage A audit does not change V3.9.6 scoring weights.",
    },
  }
}
