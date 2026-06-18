// @ts-nocheck
import { describe, expect, it } from "vitest"
import { calculateBenchmarkEligibility } from "../../utils/benchmark/calculateBenchmarkEligibility"

const base = {
  mof: { mofId: "a", metalNode: "Zr" },
  reaction: { reactionId: "r", targetProduct: "formic acid" },
  taskType: "binary",
  split: "train",
  provenanceCoverage: 1,
  syntheticFixture: false,
}

describe("calculateBenchmarkEligibility", () => {
  it("is Not Ready without a real ground-truth label", () => {
    const result = calculateBenchmarkEligibility({ ...base, label: null, labelStatus: "missing" })
    expect(result.eligible).toBe("Not Ready")
    expect(result.checks.groundTruthExists).toBe(false)
    expect(result.reasons).toContain("groundTruthExists")
  })

  it("is Ready when every gate condition is met", () => {
    const result = calculateBenchmarkEligibility({ ...base, label: "promising", labelStatus: "available" })
    expect(result.eligible).toBe("Ready")
    expect(Object.values(result.checks).every(Boolean)).toBe(true)
  })

  it("is Not Ready for synthetic fixtures even with a label", () => {
    const result = calculateBenchmarkEligibility({ ...base, label: "promising", labelStatus: "available", syntheticFixture: true })
    expect(result.eligible).toBe("Not Ready")
    expect(result.checks.notSynthetic).toBe(false)
  })

  it("is Partially Ready when a label exists but a non-blocking condition is missing", () => {
    const result = calculateBenchmarkEligibility({ ...base, label: "promising", labelStatus: "available", split: "" })
    expect(result.eligible).toBe("Partially Ready")
    expect(result.reasons).toContain("trainTestSplitDefined")
  })
})
