// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildSourceCuration } from "../../../scripts/build-v2-0-l-source-curation.mjs"

const sourceCurationRecords = ["MIL-53(Al)", "CAU-10(Al)", "MIL-100(Al)", "MIL-101(Al)", "DUT-4(Al)"].map((name, i) => ({
  recordId: `COREMOF_00000${i + 1}`,
  displayName: `${name} curated example database index preview`,
  targetMaterialName: name,
  sourceStatus: name === "MIL-101(Al)" ? "pending" : "confirmed",
  citation: name === "MIL-101(Al)" ? null : `${name} foundational reference`,
  citationStatus: name === "MIL-101(Al)" ? "partial" : "ready",
  licenseStatus: "pending",
  doiStatus: "pending",
  descriptorProvenanceStatus: "complete",
}))

const backfillRecords = sourceCurationRecords.map(r => ({ recordId: r.recordId, displayName: r.displayName, descriptorProvenanceStatus: "complete" }))

describe("build V2.0-L source curation", () => {
  it("processes at least 5 candidates and never fabricates missing fields", () => {
    const { curation, sourceSummary, enrichedRecords, report } = buildSourceCuration(sourceCurationRecords, backfillRecords)
    expect(curation.length).toBe(5)
    expect(sourceSummary.checkedCandidates).toBe(5)
    expect(sourceSummary.sourceConfirmedCount).toBe(4)
    expect(sourceSummary.citationReadyCount).toBe(4)
    // DOI and license remain pending; not fabricated.
    expect(sourceSummary.doiConfirmedCount).toBe(0)
    expect(sourceSummary.licenseConfirmedCount).toBe(0)
    expect(enrichedRecords.every(r => r.doi === null && r.license === null)).toBe(true)
  })

  it("keeps verifiedMetadataCount gated (0) when ambiguity/license block it", () => {
    const { sourceSummary, report } = buildSourceCuration(sourceCurationRecords, backfillRecords)
    expect(sourceSummary.verifiedMetadataCount).toBe(0)
    expect(report.reportStatus).toBe("source_confirmed_candidates_available")
    expect(report.verifiedCandidates).toHaveLength(0)
    expect(report.notFinalRecommendation).toBe(true)
  })
})
