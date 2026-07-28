// @ts-nocheck
import { describe, expect, it } from "vitest"
import verified from "../../../public/data/data_ingestion/verified_metadata_expansion_report_v3.json"

describe("Verified Metadata expansion (V3.3)", () => {
  it("tracks all 9,835 row-level CoRE CR identities as verified metadata", () => {
    expect(verified.verifiedCount).toBe(9835)
    expect(verified.sufficient).toBe(true)
  })

  it("uses CoRE source rows and keeps unsupported QMOF at zero", () => {
    expect(verified.sources.coreMof).toBe(9835)
    expect(verified.sources.qmof).toBe(0)
    expect(verified.note).toMatch(/row-level CoRE 2024 CR identity/i)
  })
})
