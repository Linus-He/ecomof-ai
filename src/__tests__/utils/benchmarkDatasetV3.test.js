// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v3.json"

describe("Benchmark Dataset V3", () => {
  it("provides at least 500 benchmark records", () => {
    expect(benchmark.total).toBeGreaterThanOrEqual(500)
    expect(benchmark.records.length).toBe(benchmark.total)
  })

  it("records labelSource, datasetOrigin, and benchmarkEligible on every record", () => {
    for (const r of benchmark.records.slice(0, 50)) {
      expect(r.labelSource).toBeTruthy()
      expect(r.datasetOrigin).toBeTruthy()
      expect(r.benchmarkEligible).toBeTruthy()
    }
  })

  it("keeps derived labels from being treated as experimental or eligible-ready", () => {
    expect(benchmark.records.every(r => r.datasetOrigin === "derived_dataset")).toBe(true)
    expect(benchmark.records.every(r => !/experiment/i.test(String(r.labelSource)))).toBe(true)
    expect(benchmark.summary.benchmarkEligibleCount).toBe(0)
  })
})
