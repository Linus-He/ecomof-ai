import { describe, expect, it } from "vitest"
import { calculatePerformanceScore } from "../utils/scoring"

describe("calculatePerformanceScore", () => {
  it("returns a deterministic performance score for a benchmark MOF", () => {
    const score = calculatePerformanceScore({
      co2Uptake: 5,
      selectivity: 60,
      thermodynamicIndicator: 32,
      waterStability: "high",
      thermalStability: "medium",
      evidenceLevel: "literature-supported",
    })

    expect(score.score).toBe(64.3)
  })
})
