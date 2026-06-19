// @ts-nocheck
import { describe, expect, it } from "vitest"
import { rocEligibilityV2 } from "../../utils/benchmark/rocEligibilityV2"

const good = {
  experimentalLabelAudit: { experimentalLabelCount: 40, syntheticLabelCount: 0 },
  groundTruthAudit: { verifiedGroundTruthCount: 40, invalidGroundTruthCount: 0 },
  leakage: { leakCount: 0, ok: true },
  externalTestCount: 36,
}

describe("rocEligibilityV2", () => {
  it("allows ROC-AUC under the same conditions as the accuracy gate", () => {
    const gate = rocEligibilityV2(good)
    expect(gate.metric).toBe("roc_auc")
    expect(gate.eligible).toBe(true)
    expect(gate.metricsAllowed).toBe(true)
  })

  it("keeps ROC-AUC Pending when external test < 20", () => {
    const gate = rocEligibilityV2({ ...good, externalTestCount: 4 })
    expect(gate.eligible).toBe(false)
    expect(gate.metrics.rocAuc).toBe("Pending")
    expect(gate.reasons.join(" ")).toMatch(/External test below/)
  })

  it("keeps ROC-AUC Pending when ground truth is not verified", () => {
    const gate = rocEligibilityV2({ ...good, groundTruthAudit: { verifiedGroundTruthCount: 0, invalidGroundTruthCount: 0 } })
    expect(gate.eligible).toBe(false)
  })
})
