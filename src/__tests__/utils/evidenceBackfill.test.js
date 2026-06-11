// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildEvidenceBackfillRecord,
  buildEvidenceBackfillSummary,
  buildVerifiedCandidateReport,
  getVerifiedMetadataEligibility,
  mergeEvidenceBackfillRecord,
  normalizeEvidenceBackfillRecord,
} from "../../utils/databaseIndex/evidenceBackfill"

const curation = {
  recordId: "C1",
  displayName: "Candidate 1",
  sourceDatabase: "CoRE MOF",
  sourceRecordId: "COREMOF_000010",
  descriptorProvenanceStatus: "complete",
  sourceUrl: null,
  citation: null,
  license: null,
  doi: null,
}

describe("evidenceBackfill", () => {
  it("builds a backfill record from a curation record without fabricating fields", () => {
    const record = buildEvidenceBackfillRecord(curation)
    expect(record.recordId).toBe("C1")
    expect(record.sourceUrl).toBeNull()
    expect(record.doi).toBeNull()
    expect(record.sourceStatus).toBe("pending")
    expect(record.verifiedMetadataEligible).toBe(false)
    expect(record.remainingBlockers).toContain("sourceUrl pending")
    expect(record.notFinalRecommendation).toBe(true)
  })

  it("treats source_confirmed / citation_ready / license_confirmed as NOT verified_metadata", () => {
    const sourceOnly = normalizeEvidenceBackfillRecord({ ...curation, sourceUrl: "https://example.org/r", sourceStatus: "confirmed" })
    expect(sourceOnly.metadataTransition).toBe("citation_ready" === sourceOnly.metadataTransition ? sourceOnly.metadataTransition : "citation_ready")
    expect(getVerifiedMetadataEligibility(sourceOnly)).toBe(false)

    const citation = normalizeEvidenceBackfillRecord({ ...curation, sourceUrl: "https://example.org/r", citation: "Author 2020" })
    expect(getVerifiedMetadataEligibility(citation)).toBe(false)

    const license = normalizeEvidenceBackfillRecord({ ...curation, sourceUrl: "https://example.org/r", citation: "Author 2020", license: "CC-BY-4.0" })
    expect(getVerifiedMetadataEligibility(license)).toBe(false)
    expect(license.verifiedMetadataEligible).toBe(false)
  })

  it("only becomes verifiedMetadataEligible when the full evidence loop is confirmed and the gate passes", () => {
    const record = normalizeEvidenceBackfillRecord({
      ...curation,
      sourceUrl: "https://example.org/r", sourceStatus: "confirmed",
      citation: "Author 2020", citationStatus: "ready",
      license: "CC-BY-4.0", licenseStatus: "confirmed",
      doi: "10.0000/example", doiStatus: "verified",
      descriptorProvenanceStatus: "complete",
    })
    expect(getVerifiedMetadataEligibility(record)).toBe(true)
    expect(record.verifiedMetadataEligible).toBe(true)
    expect(record.metadataTransition).toBe("verified_metadata")
  })

  it("preserves manually entered fields when merging on re-run", () => {
    const generated = buildEvidenceBackfillRecord(curation)
    const existing = { recordId: "C1", sourceUrl: "https://example.org/manual", sourceStatus: "confirmed", citation: "Manual 2019" }
    const merged = mergeEvidenceBackfillRecord(existing, generated)
    expect(merged.sourceUrl).toBe("https://example.org/manual")
    expect(merged.citation).toBe("Manual 2019")
    expect(merged.verifiedMetadataEligible).toBe(false)
  })

  it("does not crash on records missing fields", () => {
    expect(() => normalizeEvidenceBackfillRecord({})).not.toThrow()
    const normalized = normalizeEvidenceBackfillRecord({})
    expect(normalized.sourceStatus).toBe("pending")
    expect(normalized.verifiedMetadataEligible).toBe(false)
  })

  it("summarizes counts and keeps verified at 0 when there is no real evidence", () => {
    const records = [curation, { ...curation, recordId: "C2" }].map(buildEvidenceBackfillRecord)
    const summary = buildEvidenceBackfillSummary(records)
    expect(summary.recordCount).toBe(2)
    expect(summary.sourceStatusCounts.confirmed).toBe(0)
    expect(summary.verifiedMetadataCount).toBe(0)
    expect(summary.remainingBlockers["sourceUrl pending"]).toBe(2)

    const report = buildVerifiedCandidateReport(records)
    expect(report.reportStatus).toBe("no_verified_candidates_yet")
    expect(report.verifiedCandidates).toHaveLength(0)
    expect(report.nearVerifiedCandidates.length).toBeGreaterThan(0)
    // near-verified must not be mixed into verifiedCandidates
    expect(report.verifiedCandidates.some(c => report.nearVerifiedCandidates.find(n => n.recordId === c.recordId))).toBe(false)
  })
})
