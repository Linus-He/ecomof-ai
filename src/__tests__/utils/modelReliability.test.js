// @ts-nocheck
import { describe, expect, it } from "vitest"
import report from "../../../public/data/model_robustness_report_v1.json"
import { calculateModelReliability, reliabilityLevel } from "../../utils/benchmark/modelReliability"

describe("Model Reliability Score", () => {
  it("maps score to a reliability level", () => {
    expect(reliabilityLevel(85)).toBe("Reliable")
    expect(reliabilityLevel(65)).toBe("Moderately Reliable")
    expect(reliabilityLevel(40)).toBe("Low Reliability")
  })

  it("produces a 0-100 score from CV / bootstrap / generalization / consistency", () => {
    const r = calculateModelReliability({
      repeatedCvBest: { accuracyMean: 0.78, accuracyStd: 0.06 },
      bootstrapSummary: { accuracy: { mean: 0.73, std: 0.05, ci95: { lower: 0.61, upper: 0.83 } } },
      generalization: { generalizationGap: 0.27 },
      externalMetrics: { accuracy: 0.725 },
    })
    expect(r.score).toBeGreaterThan(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(Object.keys(r.components)).toEqual(["crossValidation", "bootstrap", "generalization", "consistency"])
    expect(["Reliable", "Moderately Reliable", "Low Reliability"]).toContain(r.level)
  })

  it("rewards tighter CIs and smaller gaps", () => {
    const tight = calculateModelReliability({ repeatedCvBest: { accuracyMean: 0.8, accuracyStd: 0.02 }, bootstrapSummary: { accuracy: { ci95: { lower: 0.78, upper: 0.82 } } }, generalization: { generalizationGap: 0.05 }, externalMetrics: { accuracy: 0.8 } })
    const loose = calculateModelReliability({ repeatedCvBest: { accuracyMean: 0.8, accuracyStd: 0.2 }, bootstrapSummary: { accuracy: { ci95: { lower: 0.4, upper: 0.95 } } }, generalization: { generalizationGap: 0.4 }, externalMetrics: { accuracy: 0.5 } })
    expect(tight.score).toBeGreaterThan(loose.score)
  })

  it("matches the committed report shape", () => {
    expect(report.reliability.score).toBeGreaterThan(0)
    expect(report.reliability.level).toBeTruthy()
  })
})
