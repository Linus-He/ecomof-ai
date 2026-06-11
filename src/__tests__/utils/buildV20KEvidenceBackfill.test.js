// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildEvidenceBackfill } from "../../../scripts/build-v2-0-k-evidence-backfill.mjs"

const curationRecords = Array.from({ length: 18 }, (_, i) => ({
  recordId: `R${i}`,
  displayName: `Candidate ${i}`,
  sourceDatabase: "CoRE MOF",
  sourceRecordId: `COREMOF_${i}`,
  previousTier: "near_verified",
  descriptorProvenanceStatus: i < 12 ? "complete" : "partial",
  sourceUrl: null,
  citation: null,
  license: null,
  doi: null,
}))

describe("build V2.0-K evidence backfill", () => {
  it("generates one backfill record per curation record without fabricating metadata", () => {
    const { records, summary, report } = buildEvidenceBackfill(curationRecords, [], [], [])
    expect(records.length).toBe(18)
    expect(summary.recordCount).toBe(18)
    expect(records.every(r => r.sourceUrl === null && r.doi === null && r.license === null && r.citation === null)).toBe(true)
    expect(summary.sourceStatusCounts.confirmed).toBe(0)
    expect(summary.verifiedMetadataCount).toBe(0)
    expect(report.reportStatus).toBe("no_verified_candidates_yet")
    expect(records.every(r => r.notFinalRecommendation === true)).toBe(true)
  })

  it("preserves manually entered evidence fields on re-run", () => {
    const existing = [{ recordId: "R0", sourceUrl: "https://example.org/r0", sourceStatus: "confirmed", citation: "Author 2020", citationStatus: "ready" }]
    const { records, summary } = buildEvidenceBackfill(curationRecords, [], [], existing)
    const r0 = records.find(r => r.recordId === "R0")
    expect(r0.sourceUrl).toBe("https://example.org/r0")
    expect(r0.citation).toBe("Author 2020")
    // Source + citation confirmed, but license/DOI pending -> still not verified.
    expect(r0.verifiedMetadataEligible).toBe(false)
    expect(summary.sourceStatusCounts.confirmed).toBe(1)
    expect(summary.citationStatusCounts.ready).toBe(1)
    expect(summary.verifiedMetadataCount).toBe(0)
  })
})
