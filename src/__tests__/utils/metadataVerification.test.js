// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildMetadataBlockingReasons,
  buildMetadataVerificationSummary,
  getMetadataVerificationLevel,
  isVerifiedRecommendationEligible,
  normalizeMetadataVerification,
  summarizeMetadataVerification,
} from "../../utils/databaseIndex/metadataVerification"

const verifiedRow = {
  frameworkId: "COREMOF_VERIFIED",
  displayName: "Fully sourced preview",
  sourceDatabase: "CoRE MOF",
  sourceRecordId: "COREMOF_VERIFIED",
  sourceUrl: "https://example.org/record/COREMOF_VERIFIED",
  sourceDoi: "10.1000/example",
  citation: "Example et al. 2025",
  license: "CC-BY-4.0",
  retrievedAt: "2026-06-01",
  provenanceStatus: "full",
}

describe("metadataVerification", () => {
  it("treats a fully sourced row as verified metadata and eligible", () => {
    const verification = normalizeMetadataVerification(verifiedRow)
    expect(verification.verificationLevel).toBe("verified_metadata")
    expect(verification.verifiedRecommendationEligible).toBe(true)
    expect(isVerifiedRecommendationEligible(verifiedRow)).toBe(true)
  })

  it("is not verified metadata when DOI is missing", () => {
    const row = { ...verifiedRow, sourceDoi: null, doi: null }
    expect(getMetadataVerificationLevel(row)).not.toBe("verified_metadata")
    expect(isVerifiedRecommendationEligible(row)).toBe(false)
    expect(buildMetadataBlockingReasons(row)).toContain("doiMissing")
  })

  it("is not eligible when source URL is missing", () => {
    const row = { ...verifiedRow, sourceUrl: null, url: null, sourceDatabase: null, sourceRecordId: null, frameworkId: null, provenanceStatus: "full" }
    expect(isVerifiedRecommendationEligible(row)).toBe(false)
    expect(buildMetadataBlockingReasons(row)).toContain("sourcePending")
  })

  it("warns when license is unknown", () => {
    const row = { ...verifiedRow, license: null }
    const verification = normalizeMetadataVerification(row)
    expect(verification.licenseStatus).toBe("unknown")
    expect(verification.warnings).toContain("licensePending")
  })

  it("blocks when descriptor provenance is missing", () => {
    const row = {
      frameworkId: "COREMOF_NO_PROV",
      displayName: "No provenance preview",
      provenanceStatus: "low",
    }
    const verification = normalizeMetadataVerification(row)
    expect(verification.descriptorProvenanceStatus).toBe("missing")
    expect(verification.verificationLevel).toBe("blocked")
    expect(buildMetadataBlockingReasons(row)).toContain("descriptorProvenanceMissing")
  })

  it("does not crash on legacy rows without metadataVerification fields", () => {
    const legacy = { frameworkId: "COREMOF_LEGACY", oacsPreview: 0.8, dataQualityStatus: "ready_for_scoring" }
    expect(() => normalizeMetadataVerification(legacy)).not.toThrow()
    const summary = buildMetadataVerificationSummary(legacy, "zh")
    expect(summary.level).toBeTruthy()
    expect(summary.eligible).toBe(false)
    expect(summary.summaryZh).toContain("该候选目前不能作为最终推荐依据")
    expect(summary.status.doiStatus).toBe("missing")
  })

  it("respects explicit metadataVerification overrides", () => {
    const row = {
      frameworkId: "COREMOF_OVERRIDE",
      metadataVerification: { verificationLevel: "verified_metadata", verifiedRecommendationEligible: true },
    }
    expect(getMetadataVerificationLevel(row)).toBe("verified_metadata")
    expect(isVerifiedRecommendationEligible(row)).toBe(true)
  })

  it("summarizes verification levels across a record set", () => {
    const summary = summarizeMetadataVerification([
      verifiedRow,
      { frameworkId: "COREMOF_PREVIEW", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_PREVIEW" },
      { frameworkId: "COREMOF_BLOCKED" },
    ])
    expect(summary.total).toBe(3)
    expect(summary.verified_metadata).toBe(1)
    expect(summary.eligible).toBe(1)
    expect(summary.verified_metadata + summary.partial_metadata + summary.preview_only + summary.blocked).toBe(3)
  })

  it("provides bilingual summaries for ineligible candidates", () => {
    const summary = buildMetadataVerificationSummary({ frameworkId: "COREMOF_X" }, "en")
    expect(summary.summaryEn).toContain("cannot yet support a final recommendation")
    expect(summary.summaryZh).toContain("该候选目前不能作为最终推荐依据")
  })
})
