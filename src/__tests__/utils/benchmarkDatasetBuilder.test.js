// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildBenchmarkDataset } from "../../utils/benchmark/benchmarkDatasetBuilder"

function record(id, overrides = {}) {
  return {
    recordId: id,
    qualityTier: "Gold",
    provenanceCoverage: 1,
    syntheticFixture: false,
    mof: { mofId: id, metalNode: "Zr", surfaceArea: 1000, poreVolume: 0.7, bandGap: 2.1 },
    reaction: { reactionId: `r-${id}`, targetProduct: "formic acid", temperature: 170, pressure: 30, reactionTime: 12 },
    performance: { yield: null },
    evidence: { doi: `10.1/${id}` },
    ...overrides,
  }
}

describe("buildBenchmarkDataset", () => {
  it("builds benchmark records with feature vectors and keeps labels missing when none exist", () => {
    const { records, summary } = buildBenchmarkDataset({ records: [record("a"), record("b")], labels: {} })
    expect(records).toHaveLength(2)
    expect(records[0].featureVector).toHaveProperty("surfaceArea")
    expect(records[0].featureVector).toHaveProperty("temperature")
    expect(records.every(r => r.label === null && r.labelStatus === "missing")).toBe(true)
    expect(summary.labelCount).toBe(0)
    expect(summary.trainCount).toBe(0)
    expect(summary.testCount).toBe(0)
    expect(summary.benchmarkEligibleCount).toBe(0)
  })

  it("assigns train/test splits only to labelled, non-synthetic records and reports no leakage", () => {
    const labels = {
      a: { recordId: "a", label: "promising", labelStatus: "available", labelSource: "experimental", taskType: "binary" },
      b: { recordId: "b", label: "not_promising", labelStatus: "available", labelSource: "experimental", taskType: "binary" },
    }
    const { records, summary } = buildBenchmarkDataset({ records: [record("a"), record("b")], labels })
    expect(summary.labelCount).toBe(2)
    expect(records.every(r => ["train", "test"].includes(r.split))).toBe(true)
    expect(summary.leakageOk).toBe(true)
  })

  it("never assigns a split to a synthetic record", () => {
    const labels = { a: { recordId: "a", label: "promising", labelStatus: "available" } }
    const { records } = buildBenchmarkDataset({ records: [record("a", { syntheticFixture: true })], labels })
    expect(records[0].split).toBeNull()
    expect(records[0].benchmarkEligible).toBe("Not Ready")
  })
})
