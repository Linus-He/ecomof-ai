// @ts-nocheck
import { describe, expect, it } from "vitest"
import { calculateBenchmarkEligibilityV2 } from "../../utils/benchmark/calculateBenchmarkEligibilityV2"

const readyRecord = {
  recordId: "b-1",
  groundTruthLabel: "promising",
  groundTruthValue: 52,
  labelStatus: "available",
  labelSource: "reaction_dataset_v1.performance_fields",
  split: "train",
  qualityTier: "Gold",
  syntheticFixture: false,
  provenanceCoverage: 1,
  evidence: { doi: "10.0000/test", citation: "Test citation" },
  reaction: { reactionId: "r-1", product: "formic acid", temperature: 170, pressure: 30, solvent: "water", reactionTime: 12 },
  fieldSources: Object.fromEntries(["reactionId", "product", "temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity", "conversion", "doi", "citation"].map(field => [field, { sourceRecordId: "s1", doi: "10.0000/test" }])),
}

describe("calculateBenchmarkEligibilityV2", () => {
  it("marks complete labelled reaction records Ready", () => {
    const result = calculateBenchmarkEligibilityV2(readyRecord)
    expect(result.status).toBe("Ready")
    expect(result.blockers).toHaveLength(0)
  })

  it("blocks algorithm-score labels and missing reaction data", () => {
    const result = calculateBenchmarkEligibilityV2({ ...readyRecord, labelSource: "algorithm_score", reaction: { reactionId: "r-1" } })
    expect(result.status).toBe("Not Ready")
    expect(result.blockers).toEqual(expect.arrayContaining(["reactionData", "labelSourceSafe"]))
  })
})
