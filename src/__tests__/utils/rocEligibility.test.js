// @ts-nocheck
import { describe, expect, it } from "vitest"
import { rocEligibility } from "../../utils/benchmark/rocEligibility"

const okSplit = { complete: true, counts: { train: 80, test: 20 } }
const okLeakage = { ok: true, leakCount: 0 }

describe("rocEligibility (ROC-AUC Gate)", () => {
  it("stays Pending under the same conditions as the Accuracy Gate", () => {
    const gate = rocEligibility({ labelAudit: { realExperimentalLabelCount: 0, invalidGroundTruthCount: 0 }, leakage: okLeakage, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(gate.metric).toBe("roc_auc")
    expect(gate.status).toBe("Pending")
    expect(gate.metrics).toMatchObject({ rocAuc: "Pending" })
  })

  it("is Ready only with real labels, real split, and no leakage", () => {
    const gate = rocEligibility({ labelAudit: { realExperimentalLabelCount: 120, invalidGroundTruthCount: 0 }, leakage: okLeakage, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(gate.eligible).toBe(true)
    expect(gate.status).toBe("Ready")
  })
})
