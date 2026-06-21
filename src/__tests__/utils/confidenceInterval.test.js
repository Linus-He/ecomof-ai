// @ts-nocheck
import { describe, expect, it } from "vitest"
import { confidenceInterval, confidenceIntervalAnalysis, mean, std } from "../../utils/benchmark/confidenceIntervalAnalysis"

describe("Confidence Interval Framework", () => {
  it("computes mean and std", () => {
    expect(mean([1, 2, 3])).toBe(2)
    expect(std([2, 2, 2])).toBe(0)
  })

  it("returns mean with lower <= mean <= upper (percentile)", () => {
    const values = Array.from({ length: 100 }, (_, i) => i / 100)
    const ci = confidenceInterval(values, { level: 0.95, method: "percentile" })
    expect(ci.lower).toBeLessThanOrEqual(ci.mean)
    expect(ci.upper).toBeGreaterThanOrEqual(ci.mean)
    expect(ci.n).toBe(100)
  })

  it("supports the normal-approximation method", () => {
    const ci = confidenceInterval([0.7, 0.72, 0.68, 0.71, 0.69], { method: "normal" })
    expect(ci.lower).toBeLessThan(ci.mean)
    expect(ci.upper).toBeGreaterThan(ci.mean)
  })

  it("builds a per-metric CI table", () => {
    const out = confidenceIntervalAnalysis({ distributions: { accuracy: [0.7, 0.75, 0.72], rocAuc: [0.8, 0.82, 0.79] } })
    expect(out.metrics.accuracy.mean).toBeGreaterThan(0)
    expect(out.metrics.rocAuc.mean).toBeGreaterThan(0)
    expect(out.level).toBe(0.95)
  })

  it("clamps bounds to [0, 1]", () => {
    const ci = confidenceInterval([0.99, 1, 1, 0.98], { method: "normal" })
    expect(ci.upper).toBeLessThanOrEqual(1)
    expect(ci.lower).toBeGreaterThanOrEqual(0)
  })
})
