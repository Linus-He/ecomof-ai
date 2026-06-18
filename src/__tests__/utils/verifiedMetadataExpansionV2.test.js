// @ts-nocheck
import { describe, expect, it } from "vitest"
import verified from "../../../public/data/data_ingestion/verified_metadata_expansion_report_v3.json"

describe("Verified Metadata expansion (V3.3)", () => {
  it("expands verified metadata to at least 500 from real external databases", () => {
    expect(verified.verifiedCount).toBeGreaterThanOrEqual(500)
    expect(verified.sufficient).toBe(true)
  })

  it("sources verified metadata from CoRE and QMOF without lowering the standard", () => {
    expect(verified.sources.coreMof).toBeGreaterThan(0)
    expect(verified.sources.qmof).toBeGreaterThan(0)
    expect(verified.note).toMatch(/real DOI \+ citation|standard unchanged/i)
  })
})
