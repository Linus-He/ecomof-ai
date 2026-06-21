// @ts-nocheck
import { describe, expect, it } from "vitest"
import report from "../../../public/data/model_robustness_report_v1.json"
import { calculateModelCredibilityV2, CREDIBILITY_V2_WEIGHTS } from "../../utils/benchmark/calculateModelCredibilityV2"

describe("Model Credibility Score V2", () => {
  it("adds confidenceInterval / generalization / bootstrap components to the V1 set", () => {
    const c = calculateModelCredibilityV2({
      benchmark: { rocAuc: 0.756 },
      crossValidation: { rocMean: 0.868, accuracyMean: 0.781 },
      stability: { coefficientOfVariation: 0.07 },
      ablation: { tally: { Critical: 1, Useful: 4, Marginal: 1 }, rows: new Array(6) },
      dataQuality: { verifiedGroundTruth: 150, invalidGroundTruth: 0, externalTestCount: 80, leakCount: 0, syntheticLabelCount: 0 },
      confidenceInterval: { metrics: { rocAuc: { lower: 0.64, upper: 0.86 } } },
      generalization: { generalizationGap: 0.27 },
      bootstrap: { accuracy: { std: 0.05 } },
    })
    expect(Object.keys(c.components)).toEqual(Object.keys(CREDIBILITY_V2_WEIGHTS))
    expect(c.components).toHaveProperty("confidenceInterval")
    expect(c.components).toHaveProperty("generalization")
    expect(c.components).toHaveProperty("bootstrap")
    expect(c.score).toBeGreaterThan(0)
    expect(c.score).toBeLessThanOrEqual(100)
    expect(["A", "B", "C", "D"]).toContain(c.grade)
  })

  it("weights sum to 1", () => {
    const total = Object.values(CREDIBILITY_V2_WEIGHTS).reduce((a, w) => a + w, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it("matches the committed robustness report", () => {
    expect(report.credibility.version).toBe("v2")
    expect(report.credibility.score).toBeGreaterThan(0)
    expect(["A", "B", "C", "D"]).toContain(report.credibility.grade)
  })
})
