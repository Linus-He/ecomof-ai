// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildSourceCuration } from "../../../scripts/build-v2-0-l-source-curation.mjs"

function makeCuration(overrides) {
  return {
    recordId: "MAT_1",
    displayName: "Material 1",
    targetMaterialName: "Material 1",
    descriptorProvenanceStatus: "complete",
    ...overrides,
  }
}

describe("first verified candidate report", () => {
  it("reports no_verified_candidates_yet when nothing is source-confirmed", () => {
    const curation = [makeCuration({ sourceStatus: "pending", citationStatus: "pending", licenseStatus: "pending", doiStatus: "pending" })]
    const backfill = [{ recordId: "MAT_1", displayName: "Material 1", descriptorProvenanceStatus: "complete" }]
    const { report } = buildSourceCuration(curation, backfill)
    expect(report.reportStatus).toBe("no_verified_candidates_yet")
    expect(report.verifiedCandidates).toHaveLength(0)
  })

  it("reports source_confirmed_candidates_available with source confirmed but verified=0", () => {
    const curation = [makeCuration({ sourceStatus: "confirmed", citation: "A 2020", citationStatus: "ready", licenseStatus: "pending", doiStatus: "pending" })]
    const backfill = [{ recordId: "MAT_1", displayName: "Material 1", descriptorProvenanceStatus: "complete" }]
    const { report } = buildSourceCuration(curation, backfill)
    expect(report.reportStatus).toBe("source_confirmed_candidates_available")
    expect(report.summary.verifiedMetadataCount).toBe(0)
    expect(report.verifiedCandidates).toHaveLength(0)
    expect(report.notFinalRecommendation).toBe(true)
  })

  it("promotes an eligible record into verifiedCandidates without mixing in near-verified", () => {
    const curation = [
      makeCuration({ recordId: "MAT_OK", displayName: "Eligible", targetMaterialName: "Eligible", sourceStatus: "confirmed", sourceUrl: "https://x", citation: "A 2020", citationStatus: "ready", license: "CC-BY-4.0", licenseStatus: "confirmed", doiStatus: "not_available", sourceRecordVerified: true }),
      makeCuration({ recordId: "MAT_NEAR", displayName: "Near", targetMaterialName: "Near", sourceStatus: "confirmed", citation: "B 2020", citationStatus: "ready", licenseStatus: "pending", doiStatus: "pending" }),
    ]
    const backfill = [
      { recordId: "MAT_OK", displayName: "Eligible", descriptorProvenanceStatus: "complete" },
      { recordId: "MAT_NEAR", displayName: "Near", descriptorProvenanceStatus: "complete" },
    ]
    const { report } = buildSourceCuration(curation, backfill)
    expect(report.verifiedCandidates.length).toBe(1)
    expect(report.verifiedCandidates[0].recordId).toBe("MAT_OK")
    // near candidate must not be inside verifiedCandidates
    expect(report.verifiedCandidates.some(c => c.recordId === "MAT_NEAR")).toBe(false)
    expect(report.reportStatus).toBe("verified_metadata_candidates_available")
  })
})
