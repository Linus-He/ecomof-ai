import { describe, expect, it } from "vitest"
import index from "../../../public/data/mof_physicochemical_index_v1.json"

describe("MOF physicochemical index", () => {
  it("keeps the audited CoRE primary layer and strict FAIR cross-layer counts", () => {
    expect(index.operatingMode).toMatch(/non-commercial/i)
    expect(index.summary.coreRecordCount).toBe(9835)
    expect(index.summary.corePropertyRecordCount).toBe(9835)
    expect(index.summary.fairSourceRecordCount).toBe(37452)
    expect(index.summary.exactFairRefcodeMatches).toBe(3451)
    expect(index.summary.unmatchedCoreRecords).toBe(6384)
  })

  it("stores only exact CSD Refcode cross-records and no QMOF source", () => {
    const crossRecords = index.records.filter(row => row.fairMofsCrossValidation)
    expect(crossRecords).toHaveLength(3451)
    expect(crossRecords.every(row => row.fairMofsCrossValidation.matchType === "exact-csd-refcode")).toBe(true)
    expect(crossRecords.every(row => row.csdRefcode && row.fairMofsCrossValidation.fairRecordId)).toBe(true)
    expect(JSON.stringify(index.sources)).not.toMatch(/QMOF/i)
    expect(index.identityRuleEn).toMatch(/identical CSD Refcode/i)
  })
})
