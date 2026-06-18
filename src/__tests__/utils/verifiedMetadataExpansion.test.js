// @ts-nocheck
import { describe, expect, it } from "vitest"
import report from "../../../public/data/data_ingestion/verified_metadata_expansion_report.json"

describe("verified metadata expansion report", () => {
  it("meets V3.1 verified metadata target and preserves source coverage", () => {
    expect(report.verifiedCount).toBeGreaterThanOrEqual(100)
    expect(report.blockedCount).toBe(0)
    expect(Object.keys(report.sourceCoverage).length).toBeGreaterThan(0)
    expect(report.criteria).toEqual(expect.arrayContaining(["non-synthetic", "DOI present", "citation present", "license/source registry present", "field provenance present"]))
    expect(report.note).toMatch(/does not mint new DOI/)
  })
})
