// @ts-nocheck
import { describe, expect, it } from "vitest"
import { accuracyEligibility } from "../../utils/benchmark/accuracyEligibility"

const okSplit = { complete: true, counts: { train: 80, test: 20 } }
const okLeakage = { ok: true, leakCount: 0 }

describe("accuracyEligibility (Accuracy Gate)", () => {
  it("stays Pending without real experimental labels", () => {
    const gate = accuracyEligibility({ labelAudit: { realExperimentalLabelCount: 0, invalidGroundTruthCount: 0 }, leakage: okLeakage, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(gate.status).toBe("Pending")
    expect(gate.metricsAllowed).toBe(false)
    expect(gate.metrics).toMatchObject({ accuracy: "Pending", f1: "Pending" })
    expect(gate.reasons.join(" ")).toMatch(/experimental labels/i)
  })

  it("blocks when algorithm-generated labels are present", () => {
    const gate = accuracyEligibility({ labelAudit: { realExperimentalLabelCount: 50, invalidGroundTruthCount: 3 }, leakage: okLeakage, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(gate.eligible).toBe(false)
    expect(gate.reasons.join(" ")).toMatch(/ground truth/i)
  })

  it("blocks on data leakage or incomplete split", () => {
    const leak = accuracyEligibility({ labelAudit: { realExperimentalLabelCount: 50, invalidGroundTruthCount: 0 }, leakage: { ok: false, leakCount: 4 }, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(leak.status).toBe("Pending")
    const noSplit = accuracyEligibility({ labelAudit: { realExperimentalLabelCount: 50, invalidGroundTruthCount: 0 }, leakage: okLeakage, split: { complete: false, counts: { train: 0, test: 0 } }, benchmarkEligibleConfirmed: 120 })
    expect(noSplit.status).toBe("Pending")
  })

  it("is Ready only when real labels, real split, no leakage, and >=100 confirmed eligible", () => {
    const gate = accuracyEligibility({ labelAudit: { realExperimentalLabelCount: 120, invalidGroundTruthCount: 0 }, leakage: okLeakage, split: okSplit, benchmarkEligibleConfirmed: 120 })
    expect(gate.eligible).toBe(true)
    expect(gate.status).toBe("Ready")
    expect(gate.metricsAllowed).toBe(true)
  })
})
