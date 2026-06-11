// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildAmbiguityWarnings,
  buildSourceCurationSummary,
  getVerifiedMetadataReadiness,
  mergeSourceCurationIntoEvidenceBackfill,
  normalizeManualSourceCuration,
  validateSourceCurationRecord,
} from "../../utils/databaseIndex/manualSourceCuration"

const base = {
  recordId: "MAT_1",
  displayName: "Test material",
  targetMaterialName: "Test material",
  descriptorProvenanceStatus: "complete",
}

describe("manualSourceCuration", () => {
  it("treats source_confirmed as NOT verified metadata", () => {
    const record = normalizeManualSourceCuration({ ...base, sourceUrl: "https://example.org/r", sourceStatus: "confirmed" })
    expect(record.verifiedMetadataEligible).toBe(false)
    expect(getVerifiedMetadataReadiness(record).eligible).toBe(false)
  })

  it("treats citation_ready as NOT verified metadata", () => {
    const record = normalizeManualSourceCuration({ ...base, sourceUrl: "https://example.org/r", citation: "Author 2020" })
    expect(record.verifiedMetadataEligible).toBe(false)
  })

  it("does not allow verified when license is unknown", () => {
    const record = normalizeManualSourceCuration({ ...base, sourceUrl: "https://x", citation: "A 2020", licenseStatus: "unknown", doiStatus: "not_available" })
    expect(record.verifiedMetadataEligible).toBe(false)
  })

  it("accepts DOI not_available only with full source/citation/license/provenance and no ambiguity", () => {
    const record = normalizeManualSourceCuration({
      recordId: "MAT_2", displayName: "Mat 2", targetMaterialName: "Mat 2",
      sourceUrl: "https://x", sourceStatus: "confirmed",
      citation: "A 2020", citationStatus: "ready",
      license: "CC-BY-4.0", licenseStatus: "confirmed",
      doiStatus: "not_available",
      descriptorProvenanceStatus: "complete",
    })
    expect(record.verifiedMetadataEligible).toBe(true)
  })

  it("blocks verified when an ambiguity warning is present", () => {
    const record = normalizeManualSourceCuration({
      recordId: "MAT_3", displayName: "Mat 3", targetMaterialName: "Mat 3",
      sourceUrl: "https://x", sourceStatus: "confirmed",
      citation: "A 2020", citationStatus: "ready",
      license: "CC-BY-4.0", licenseStatus: "confirmed",
      doiStatus: "not_available",
      descriptorProvenanceStatus: "complete",
      ambiguityWarnings: ["material name only loosely matches the source"],
    })
    expect(buildAmbiguityWarnings(record).length).toBeGreaterThan(0)
    expect(record.verifiedMetadataEligible).toBe(false)
  })

  it("auto-warns on curated fixture record ids", () => {
    const warnings = buildAmbiguityWarnings({ recordId: "COREMOF_000001", displayName: "MIL-53(Al)" })
    expect(warnings.length).toBeGreaterThan(0)
  })

  it("validates structural consistency without fabricating", () => {
    expect(validateSourceCurationRecord({ recordId: "x", doiStatus: "confirmed", doi: null }).valid).toBe(false)
    expect(validateSourceCurationRecord({ recordId: "x", sourceStatus: "confirmed", citation: "A 2020" }).valid).toBe(true)
  })

  it("does not crash on missing fields", () => {
    expect(() => normalizeManualSourceCuration({})).not.toThrow()
  })

  it("merges source curation into evidence backfill without making anything verified by source alone", () => {
    const backfill = [{ recordId: "COREMOF_000001", displayName: "MIL-53(Al)", descriptorProvenanceStatus: "complete" }]
    const curation = [{ recordId: "COREMOF_000001", displayName: "MIL-53(Al)", targetMaterialName: "MIL-53(Al)", sourceStatus: "confirmed", citation: "Loiseau 2004", citationStatus: "ready", descriptorProvenanceStatus: "complete" }]
    const enriched = mergeSourceCurationIntoEvidenceBackfill(backfill, curation)
    expect(enriched[0].sourceStatus).toBe("confirmed")
    expect(enriched[0].verifiedMetadataEligible).toBe(false)
    expect(enriched[0].ambiguityWarnings.length).toBeGreaterThan(0)

    const summary = buildSourceCurationSummary(curation)
    expect(summary.sourceConfirmedCount).toBe(1)
    expect(summary.verifiedMetadataCount).toBe(0)
  })
})
