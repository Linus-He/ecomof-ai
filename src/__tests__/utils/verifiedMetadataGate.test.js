// @ts-nocheck
import { describe, expect, it } from "vitest"
import { runVerifiedMetadataGate, buildVerifiedMetadataGateSummary, normalizeVerificationRecord } from "../../utils/databaseIndex/verifiedMetadataGate"

const confirmedAll = {
  candidateId: "X", displayName: "X", sourceConfirmed: true,
  sourceUrl: "https://x", sourceUrlStatus: "confirmed",
  license: "CC-BY-4.0", licenseStatus: "confirmed",
  exactCitation: "Author 2020, J, vol:page", citationStatus: "confirmed",
  fixtureRecordMappingStatus: "confirmed", ambiguityWarnings: [],
}

describe("verifiedMetadataGate", () => {
  it("passes only when all strict conditions hold", () => {
    expect(runVerifiedMetadataGate(confirmedAll).verifiedMetadata).toBe(true)
  })

  it("source_confirmed alone is NOT verified metadata", () => {
    const r = runVerifiedMetadataGate({ ...confirmedAll, licenseStatus: "pending", citationStatus: "pending", fixtureRecordMappingStatus: "ambiguous" })
    expect(r.verifiedMetadata).toBe(false)
    expect(r.verificationBlockers.length).toBeGreaterThan(0)
  })

  it("an ambiguity warning blocks verified metadata", () => {
    const r = runVerifiedMetadataGate({ ...confirmedAll, ambiguityWarnings: ["Cr vs Al framework"] })
    expect(r.verifiedMetadata).toBe(false)
  })

  it("summary reports verifiedMetadataCount and blocking reasons when 0", () => {
    const records = [
      { candidateId: "A", sourceConfirmed: true, sourceUrlStatus: "pending", licenseStatus: "pending", citationStatus: "pending", fixtureRecordMappingStatus: "ambiguous", ambiguityWarnings: [] },
      { candidateId: "B", sourceConfirmed: false, sourceUrlStatus: "ambiguous", licenseStatus: "pending", citationStatus: "ambiguous", fixtureRecordMappingStatus: "ambiguous", ambiguityWarnings: ["Cr vs Al"], quarantined: true },
    ]
    const summary = buildVerifiedMetadataGateSummary(records)
    expect(summary.verifiedMetadataCount).toBe(0)
    expect(summary.sourceConfirmedCount).toBe(1)
    expect(summary.quarantinedCount).toBe(1)
    expect(summary.blockingReasons.length).toBeGreaterThan(0)
    expect(summary.verifiedMetadataReached).toBe(false)
  })

  it("does not crash on missing fields and never fabricates", () => {
    const norm = normalizeVerificationRecord({})
    expect(norm.verifiedMetadata).toBe(false)
    expect(norm.doi).toBeNull()
    expect(norm.notFinalRecommendation).toBe(true)
  })
})
