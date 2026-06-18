// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import { dataLeakageCheckV2 } from "../../utils/benchmark/dataLeakageCheckV2"

describe("dataLeakageCheckV2", () => {
  it("passes the generated V3.1 benchmark dataset", () => {
    const result = dataLeakageCheckV2({ records: benchmark.records })
    expect(result.ok).toBe(true)
    expect(result.leaks).toHaveLength(0)
    expect(result.unsafeLabels).toHaveLength(0)
  })

  it("detects DOI, reaction, catalyst, and algorithm-label leakage", () => {
    const records = [
      { recordId: "a", split: "train", labelSource: "reaction", evidence: { doi: "10.same/doi" }, reaction: { reactionId: "rxn-1", temperature: 170, pressure: 30, solvent: "water", reactionTime: 12 }, mof: { mofId: "cat-1" } },
      { recordId: "b", split: "test", labelSource: "algorithm_score", evidence: { doi: "10.same/doi" }, reaction: { reactionId: "rxn-1", temperature: 170, pressure: 30, solvent: "water", reactionTime: 12 }, mof: { mofId: "cat-1" } },
    ]
    const result = dataLeakageCheckV2({ records })
    expect(result.ok).toBe(false)
    expect(result.leaks.map(row => row.type)).toEqual(expect.arrayContaining(["doi", "reaction", "catalyst", "experiment"]))
    expect(result.unsafeLabels).toHaveLength(1)
  })
})
