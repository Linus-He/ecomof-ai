import { describe, expect, it } from "vitest"
import { createScoringModel } from "../../scoring"

const candidates = [
  { id: "perf", name: "High performance", surfaceArea: 3000, poreVolume: 1.8, poreSizeA: 20, co2Uptake: 9, evidenceLevel: "needs-validation", sourceConfirmed: false, citationReady: false },
  { id: "evidence", name: "Evidence ready", surfaceArea: 2800, poreVolume: 1.7, poreSizeA: 19, co2Uptake: 8.5, evidenceLevel: "experimental", sourceConfirmed: true, citationReady: true },
  { id: "weak", name: "Weak baseline", surfaceArea: 500, poreVolume: 0.3, poreSizeA: 5, co2Uptake: 1, evidenceLevel: "needs-validation", sourceConfirmed: false, citationReady: false },
]

function model(mode) {
  return createScoringModel({
    candidates,
    descriptorKeys: ["surfaceArea", "poreVolume", "poreSizeA", "co2Uptake"],
    algorithm: "manual",
    manualWeights: { surfaceArea: 1, poreVolume: 1, poreSizeA: 1, co2Uptake: 1 },
    missingValueStrategy: "median",
    performancePriorityMode: mode,
  })
}

describe("performancePriorityMode", () => {
  it("changes ranking explanation and can change the top candidate", () => {
    const performanceFirst = model("performance_first")
    const evidenceFirst = model("evidence_first")

    expect(performanceFirst.rankings[0].id).toBe("perf")
    expect(evidenceFirst.rankings[0].id).toBe("evidence")
    expect(evidenceFirst.rankings[0].priorityImpact.modeId).toBe("evidence_first")
    expect(evidenceFirst.rankings[0].priorityImpact.explanationZh).toMatch(/证据优先/)
    expect(evidenceFirst.metadata.performancePriorityMode).toBe("evidence_first")
  })
})
