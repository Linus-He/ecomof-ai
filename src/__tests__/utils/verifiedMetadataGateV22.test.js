import { describe, expect, it } from "vitest"
import { buildVerifiedMetadataGateSummary, runVerifiedMetadataGate } from "../../utils/databaseIndex/verifiedMetadataGate"

const confirmed = {
  candidateId: "CORE-VERIFIED",
  displayName: "CORE-VERIFIED",
  sourceConfirmed: true,
  sourceUrlStatus: "confirmed",
  licenseStatus: "confirmed",
  citationStatus: "confirmed",
  fixtureRecordMappingStatus: "confirmed",
  fieldLevelCriticalProvenanceComplete: true,
  ambiguityWarnings: [],
  verificationBlockers: [],
}

describe("verifiedMetadataGate V2.2", () => {
  it("requires field-level critical provenance completeness", () => {
    const gate = runVerifiedMetadataGate({ ...confirmed, fieldLevelCriticalProvenanceComplete: false })
    expect(gate.verifiedMetadata).toBe(false)
    expect(gate.verificationBlockers).toContain("critical field provenance incomplete")
  })

  it("blocks field-level ambiguity even when source, citation, license, and mapping are confirmed", () => {
    const gate = runVerifiedMetadataGate({ ...confirmed, ambiguityWarnings: ["surfaceArea ambiguous"] })
    expect(gate.verifiedMetadata).toBe(false)
    expect(gate.ambiguityWarnings).toContain("surfaceArea ambiguous")
  })

  it("never verifies synthetic fixtures", () => {
    const gate = runVerifiedMetadataGate({ ...confirmed, isSyntheticFixture: true, curationStatus: "synthetic_fixture_expansion" })
    expect(gate.verifiedMetadata).toBe(false)
    expect(gate.verificationBlockers).toContain("synthetic fixture")
  })

  it("keeps verifiedMetadataCount separate from sourceConfirmedCount", () => {
    const summary = buildVerifiedMetadataGateSummary([
      confirmed,
      { ...confirmed, candidateId: "SOURCE-ONLY", fieldLevelCriticalProvenanceComplete: false },
    ])

    expect(summary.sourceConfirmedCount).toBe(2)
    expect(summary.verifiedMetadataCount).toBe(1)
    expect(summary.sourceConfirmedCount).not.toBe(summary.verifiedMetadataCount)
  })
})
