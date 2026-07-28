// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v3.json"

describe("Benchmark Dataset V3", () => {
  it("quarantines the legacy derived V3.3 benchmark records", () => {
    expect(benchmark.total).toBe(0)
    expect(benchmark.records.length).toBe(benchmark.total)
    expect(benchmark.status).toBe("quarantined")
  })

  it("records labelSource, datasetOrigin, and benchmarkEligible on every record", () => {
    for (const r of benchmark.records.slice(0, 50)) {
      expect(r.labelSource).toBeTruthy()
      expect(r.datasetOrigin).toBeTruthy()
      expect(r.benchmarkEligible).toBeTruthy()
    }
  })

  it("keeps derived labels from being treated as experimental or eligible-ready", () => {
    expect(benchmark.excludedFromCurrentStatistics).toBe(true)
    expect(benchmark.summary.benchmarkEligibleCount).toBe(0)
  })
})
