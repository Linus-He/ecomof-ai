// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { dataLeakageCheckV3 } from "../../utils/benchmark/dataLeakageCheckV3"

describe("buildBenchmarkSplitV2", () => {
  it("builds a complete 70/15/15 split plus an external test split", () => {
    const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })
    expect(split.complete).toBe(true)
    expect(split.counts.train).toBeGreaterThan(0)
    expect(split.counts.validation).toBeGreaterThan(0)
    expect(split.counts.test).toBeGreaterThan(0)
    expect(split.counts.external_test).toBe(externalData.records.length)
    expect(split.ratios.train).toBeGreaterThan(0.55)
    expect(split.ratios.train).toBeLessThan(0.85)
  })

  it("never lets the same catalyst / experiment / DOI cross internal splits (leak = 0)", () => {
    const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })
    const internal = split.records.filter(r => r.split !== "external_test")
    const leakage = dataLeakageCheckV3({ records: internal })
    expect(leakage.leakCount).toBe(0)
    expect(leakage.ok).toBe(true)
  })

  it("keeps records sharing a DOI in a single split (union-find grouping)", () => {
    const records = [
      { recordId: "1", candidateId: "A", sourceDoi: "10.1/x", groundTruthClass: "promising" },
      { recordId: "2", candidateId: "B", sourceDoi: "10.1/x", groundTruthClass: "not_promising" },
      { recordId: "3", candidateId: "C", sourceDoi: "10.1/y", groundTruthClass: "promising" },
      { recordId: "4", candidateId: "D", sourceDoi: "10.1/z", groundTruthClass: "promising" },
    ]
    const split = buildBenchmarkSplitV2({ records, externalTest: [], seed: 3 })
    const byDoi = {}
    for (const r of split.records) { byDoi[r.sourceDoi] = byDoi[r.sourceDoi] || new Set(); byDoi[r.sourceDoi].add(r.split) }
    for (const s of Object.values(byDoi)) expect(s.size).toBe(1)
  })
})
