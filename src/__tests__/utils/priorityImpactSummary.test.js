import { describe, expect, it } from "vitest"
import { buildPriorityImpactSummary } from "../../utils/performancePriority"

describe("priorityImpactSummary", () => {
  it("describes affected descriptors, boosted weights, and penalized factors", () => {
    const summary = buildPriorityImpactSummary("performance_first")

    expect(summary.modeLabelZh).toBe("性能优先")
    expect(summary.affectedDescriptors).toEqual(expect.arrayContaining(["surfaceArea", "poreVolume", "poreSizeA"]))
    expect(summary.boostedWeights).toContain("surfaceArea")
    expect(summary.penalizedFactors).toContain("missing performance descriptors")
    expect(summary.summaryZh).toMatch(/当前为“性能优先”/)
  })
})
