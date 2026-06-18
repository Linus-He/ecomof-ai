// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"

describe("benchmark dataset v2", () => {
  it("meets V3.1 benchmark target with benchmark eligibility fields", () => {
    expect(benchmark.records.length).toBeGreaterThanOrEqual(300)
    expect(benchmark.summary.benchmarkEligibleCount).toBeGreaterThanOrEqual(30)
    expect(benchmark.summary.labelCount).toBeGreaterThanOrEqual(30)
    expect(benchmark.summary.leakageOk).toBe(true)
    const ready = benchmark.records.find(row => row.benchmarkEligible === "Ready")
    expect(ready).toMatchObject({
      taskType: "binary_organic_acid_promising",
      labelStatus: "available",
      syntheticFixture: false,
    })
    expect(ready.groundTruthLabel).toMatch(/promising|not_promising/)
    expect(ready.benchmarkBlockers).toHaveLength(0)
  })
})
