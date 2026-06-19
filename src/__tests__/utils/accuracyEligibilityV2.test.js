// @ts-nocheck
import { describe, expect, it } from "vitest"
import { accuracyEligibilityV2 } from "../../utils/benchmark/accuracyEligibilityV2"

const good = {
  experimentalLabelAudit: { experimentalLabelCount: 40, syntheticLabelCount: 0 },
  groundTruthAudit: { verifiedGroundTruthCount: 40, invalidGroundTruthCount: 0 },
  leakage: { leakCount: 0, ok: true },
  externalTestCount: 36,
}

describe("accuracyEligibilityV2", () => {
  it("allows Accuracy / Precision / Recall / F1 when all conditions hold", () => {
    const gate = accuracyEligibilityV2(good)
    expect(gate.eligible).toBe(true)
    expect(gate.status).toBe("Ready")
    expect(gate.metricsAllowed).toBe(true)
    expect(gate.reasons).toHaveLength(0)
  })

  it("stays Pending when experimental labels < 20", () => {
    const gate = accuracyEligibilityV2({ ...good, experimentalLabelAudit: { experimentalLabelCount: 10, syntheticLabelCount: 0 } })
    expect(gate.eligible).toBe(false)
    expect(gate.metrics.accuracy).toBe("Pending")
    expect(gate.reasons.join(" ")).toMatch(/Experimental labels below/)
  })

  it("stays Pending on data leakage, invalid ground truth, or too few external tests", () => {
    expect(accuracyEligibilityV2({ ...good, leakage: { leakCount: 2, ok: false } }).eligible).toBe(false)
    expect(accuracyEligibilityV2({ ...good, groundTruthAudit: { verifiedGroundTruthCount: 40, invalidGroundTruthCount: 3 } }).eligible).toBe(false)
    expect(accuracyEligibilityV2({ ...good, externalTestCount: 5 }).eligible).toBe(false)
  })

  it("stays Pending when synthetic labels exist", () => {
    const gate = accuracyEligibilityV2({ ...good, experimentalLabelAudit: { experimentalLabelCount: 40, syntheticLabelCount: 4 } })
    expect(gate.eligible).toBe(false)
    expect(gate.reasons.join(" ")).toMatch(/Synthetic/)
  })
})
