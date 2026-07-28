import { buildFamilyFairnessAudit } from "./familyAudit.js"
import { buildProxyValidityAudit } from "./proxyValidity.js"

export { buildFamilyFairnessAudit } from "./familyAudit.js"
export { buildProxyValidityAudit, spearmanCorrelation } from "./proxyValidity.js"

export function buildOrganicAcidAudit(datasets = {}) {
  return {
    version: "V3.9.10",
    generatedAt: "runtime",
    proxyValidity: buildProxyValidityAudit(datasets),
    familyFairness: buildFamilyFairnessAudit(datasets),
    scoringMutation: {
      applied: false,
      note: "The locked spec-v3 keeps route weights fixed, removes direct family-frequency scoring, and audits abundance invariance explicitly.",
    },
  }
}
