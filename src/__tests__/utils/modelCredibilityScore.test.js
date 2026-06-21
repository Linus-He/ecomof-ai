// @ts-nocheck
import { describe, expect, it } from "vitest"
import report from "../../../public/data/model_credibility_report_v1.json"
import { calculateModelCredibility, gradeFor } from "../../utils/benchmark/calculateModelCredibility"

describe("Model Credibility Score", () => {
  it("grades by score thresholds", () => {
    expect(gradeFor(90)).toBe("A")
    expect(gradeFor(75)).toBe("B")
    expect(gradeFor(60)).toBe("C")
    expect(gradeFor(40)).toBe("D")
  })

  it("produces a 0–100 score with five components and a grade", () => {
    const c = calculateModelCredibility({
      benchmark: { rocAuc: 0.706 },
      crossValidation: { rocMean: 0.885, accuracyMean: 0.75 },
      stability: { coefficientOfVariation: 0.1 },
      ablation: { tally: { Critical: 1, Useful: 4, Marginal: 1 }, rows: new Array(6) },
      dataQuality: { verifiedGroundTruth: 40, invalidGroundTruth: 0, externalTestCount: 36, leakCount: 0, syntheticLabelCount: 0 },
    })
    expect(c.score).toBeGreaterThan(0)
    expect(c.score).toBeLessThanOrEqual(100)
    expect(["A", "B", "C", "D"]).toContain(c.grade)
    expect(Object.keys(c.components)).toEqual(["benchmark", "crossValidation", "stability", "sensitivity", "dataQuality"])
  })

  it("penalizes leakage and invalid ground truth in the data-quality component", () => {
    const good = calculateModelCredibility({ benchmark: { rocAuc: 0.7 }, crossValidation: { rocMean: 0.7 }, stability: { coefficientOfVariation: 0.1 }, ablation: { tally: {}, rows: new Array(6) }, dataQuality: { verifiedGroundTruth: 40, invalidGroundTruth: 0, externalTestCount: 36, leakCount: 0, syntheticLabelCount: 0 } })
    const bad = calculateModelCredibility({ benchmark: { rocAuc: 0.7 }, crossValidation: { rocMean: 0.7 }, stability: { coefficientOfVariation: 0.1 }, ablation: { tally: {}, rows: new Array(6) }, dataQuality: { verifiedGroundTruth: 0, invalidGroundTruth: 5, externalTestCount: 2, leakCount: 3, syntheticLabelCount: 4 } })
    expect(bad.components.dataQuality).toBeLessThan(good.components.dataQuality)
    expect(bad.score).toBeLessThan(good.score)
  })

  it("matches the committed report (deterministic)", () => {
    expect(report.credibility.score).toBeGreaterThan(0)
    expect(["A", "B", "C", "D"]).toContain(report.credibility.grade)
  })
})
