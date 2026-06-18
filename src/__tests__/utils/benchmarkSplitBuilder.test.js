// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import { buildBenchmarkSplit } from "../../utils/benchmark/buildBenchmarkSplit"
import { dataLeakageCheckV3 } from "../../utils/benchmark/dataLeakageCheckV3"

describe("buildBenchmarkSplit", () => {
  it("produces a complete train/validation/test split near 70/15/15 on real data", () => {
    const split = buildBenchmarkSplit(benchmark.records)
    expect(split.complete).toBe(true)
    expect(split.counts.train).toBeGreaterThan(0)
    expect(split.counts.test).toBeGreaterThan(0)
    expect(split.ratios.train).toBeGreaterThan(0.6)
    expect(split.ratios.train).toBeLessThan(0.8)
  })

  it("never lets the same catalyst cross splits (zero leakage)", () => {
    const split = buildBenchmarkSplit(benchmark.records)
    const leakage = dataLeakageCheckV3({ records: split.records })
    expect(leakage.leakCount).toBe(0)
    expect(leakage.ok).toBe(true)
  })

  it("keeps every record of one catalyst in a single split", () => {
    const records = [
      { recordId: "1", catalystId: "A", binaryLabel: "promising" },
      { recordId: "2", catalystId: "A", binaryLabel: "not_promising" },
      { recordId: "3", catalystId: "B", binaryLabel: "promising" },
      { recordId: "4", catalystId: "C", binaryLabel: "promising" },
    ]
    const split = buildBenchmarkSplit(records, { seed: 1 })
    const byCatalyst = {}
    for (const r of split.records) { byCatalyst[r.catalystId] = byCatalyst[r.catalystId] || new Set(); byCatalyst[r.catalystId].add(r.split) }
    for (const splits of Object.values(byCatalyst)) expect(splits.size).toBe(1)
  })
})
