// @ts-nocheck
import { describe, expect, it } from "vitest"
import { dataLeakageCheckV3 } from "../../utils/benchmark/dataLeakageCheckV3"

describe("dataLeakageCheckV3", () => {
  it("passes when each catalyst stays in one split", () => {
    const result = dataLeakageCheckV3({ records: [
      { recordId: "1", catalystId: "A", split: "train", evidence: { doi: "10.1/a" } },
      { recordId: "2", catalystId: "B", split: "test", evidence: { doi: "10.1/b" } },
    ] })
    expect(result.ok).toBe(true)
    expect(result.leakCount).toBe(0)
  })

  it("flags a catalyst crossing train and test as a high-severity leak", () => {
    const result = dataLeakageCheckV3({ records: [
      { recordId: "1", catalystId: "A", split: "train" },
      { recordId: "2", catalystId: "A", split: "test" },
    ] })
    expect(result.leakCount).toBeGreaterThan(0)
    expect(result.leakSeverity).toBe("high")
    expect(result.ok).toBe(false)
  })

  it("treats a shared dataset DOI across splits as a warning, not a hard leak", () => {
    const result = dataLeakageCheckV3({ records: [
      { recordId: "1", catalystId: "A", split: "train", evidence: { doi: "10.5281/zenodo.shared" } },
      { recordId: "2", catalystId: "B", split: "test", evidence: { doi: "10.5281/zenodo.shared" } },
    ] })
    expect(result.leakCount).toBe(0)
    expect(result.sharedDoiWarnings.length).toBeGreaterThan(0)
  })

  it("flags algorithm-score labels as unsafe", () => {
    const result = dataLeakageCheckV3({ records: [{ recordId: "1", catalystId: "A", split: "train", labelSource: "finalScore" }] })
    expect(result.unsafeLabels.length).toBe(1)
    expect(result.ok).toBe(false)
  })
})
