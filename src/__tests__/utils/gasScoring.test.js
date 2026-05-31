import { describe, expect, it } from "vitest"
import records from "../../../public/data/gas_adsorption_records_demo.json"
import {
  getEvidencePenalty,
  getScenarioWeights,
  getStabilityPenalty,
  normalizeGasMetric,
  rankGasCandidates,
  scoreGasCandidate,
} from "../../utils/gasScoring"

describe("gasScoring", () => {
  it("normalizes scenario weights and shifts them by target priority", () => {
    const balanced = getScenarioWeights("CO2/N2", "Balanced")
    const uptake = getScenarioWeights("CO2/N2", "High uptake")
    expect(Object.values(balanced).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6)
    expect(uptake.uptake).toBeGreaterThan(balanced.uptake)
  })

  it("ranks only the selected gas pair and returns 0-100 scores", () => {
    const ranked = rankGasCandidates(records, {
      gasPair: "VOC/N2",
      temperatureK: 298,
      pressureBar: 1,
      targetPriority: "High working capacity",
    })
    expect(ranked).toHaveLength(3)
    expect(ranked.every(record => record.gasPair === "VOC/N2")).toBe(true)
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score)
    expect(ranked.every(record => record.score >= 0 && record.score <= 100)).toBe(true)
  })

  it("records score contributions and penalties without NaN", () => {
    const ranked = rankGasCandidates(records, { gasPair: "CO2/N2", targetPriority: "Balanced" })
    const scored = scoreGasCandidate(ranked[0], { gasPair: "CO2/N2", targetPriority: "Balanced" }, ranked)
    expect(Number.isFinite(scored.score)).toBe(true)
    expect(Number.isFinite(scored.scoreBreakdown.riskPenalty)).toBe(true)
    expect(scored.scoreBreakdown.topDrivers.length).toBeGreaterThan(0)
    expect(scored.scoreBreakdown.draggers.length).toBeGreaterThan(0)
    expect(getEvidencePenalty(scored)).toBeGreaterThanOrEqual(0)
    expect(getStabilityPenalty(scored, { gasPair: "CO2/N2" })).toBeGreaterThanOrEqual(0)
  })

  it("normalizes equal single-point domains to a useful midpoint", () => {
    expect(normalizeGasMetric(7, "selectivity", [{ selectivity: 7 }])).toBeCloseTo(0.72)
  })
})

