// @ts-nocheck
import { describe, expect, it } from "vitest"
import { getCoreDescriptorCompleteness } from "../../scoring/descriptors/descriptorAccessors"

describe("core descriptor completeness", () => {
  it("counts the eight shared MOF descriptors with compatible curation statuses", () => {
    const summary = getCoreDescriptorCompleteness({
      surfaceArea: 1200,
      poreSizeA: 9,
      poreVolume: 1.1,
      co2Uptake: null,
      bandGap: 2.1,
      waterStability: "pending",
      thermalStability: "high",
      toxicityConcern: "low",
      descriptorCompleteness: {
        surfaceArea: "curated",
        poreSizeA: "curated",
        poreVolume: "curated",
        co2Uptake: "missing",
        bandGap: "needs-review",
        waterStability: "pending",
        thermalStability: "curated",
        toxicityConcern: "curated",
      },
    })
    expect(summary.descriptorCount).toBe(8)
    expect(summary.curatedCount).toBe(5)
    expect(summary.rows.map(row => row.status)).toContain("needs-review")
  })
})
