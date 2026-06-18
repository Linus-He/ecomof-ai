// @ts-nocheck
import { describe, expect, it } from "vitest"
import { dataLeakageCheck } from "../../utils/benchmark/dataLeakageCheck"

describe("dataLeakageCheck", () => {
  it("passes a clean train/test split", () => {
    const result = dataLeakageCheck({ records: [
      { recordId: "1", labelSource: "experimental", split: "train", evidence: { doi: "10.1/a" } },
      { recordId: "2", labelSource: "experimental", split: "test", evidence: { doi: "10.1/b" } },
    ] })
    expect(result.ok).toBe(true)
    expect(result.leaks).toHaveLength(0)
  })

  it("flags algorithm score used as ground truth", () => {
    const result = dataLeakageCheck({ records: [{ recordId: "1", labelSource: "finalScore", split: "train" }] })
    expect(result.leaks.some(l => l.type === "algorithm_score_as_ground_truth")).toBe(true)
  })

  it("flags external-test records placed in training", () => {
    const result = dataLeakageCheck({ records: [{ recordId: "1", externalTest: true, split: "train" }] })
    expect(result.leaks.some(l => l.type === "external_test_in_training")).toBe(true)
  })

  it("flags the same DOI spanning train and test", () => {
    const result = dataLeakageCheck({ records: [
      { recordId: "1", split: "train", evidence: { doi: "10.1/shared" } },
      { recordId: "2", split: "test", evidence: { doi: "10.1/shared" } },
    ] })
    expect(result.leaks.some(l => l.type === "doi_cross_split_leak")).toBe(true)
    expect(result.ok).toBe(false)
  })
})
