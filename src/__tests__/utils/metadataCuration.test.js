// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildCurationProgressSummary,
  canUpgradeToVerifiedMetadata,
  getMetadataCurationStatus,
  normalizeMetadataCuration,
} from "../../utils/databaseIndex/metadataCuration"

const pendingRecord = {
  recordId: "C1",
  displayName: "Candidate 1",
  sourceDatabase: "CoRE MOF",
  sourceRecordId: "COREMOF_000010",
  descriptorProvenanceStatus: "complete",
  sourceUrl: null,
  doi: null,
  citation: null,
  license: null,
}

describe("metadataCuration", () => {
  it("classifies a fully pending record as needs_source_review", () => {
    expect(getMetadataCurationStatus(pendingRecord)).toBe("needs_source_review")
  })

  it("source_confirmed is not verified_metadata", () => {
    const record = { ...pendingRecord, sourceUrl: "https://example.org/record/COREMOF_000010", sourceUrlStatus: "confirmed" }
    expect(getMetadataCurationStatus(record)).toBe("source_confirmed")
    expect(getMetadataCurationStatus(record)).not.toBe("verified_metadata")
    expect(canUpgradeToVerifiedMetadata(record)).toBe(false)
  })

  it("citation_ready is not verified_metadata", () => {
    const record = { ...pendingRecord, sourceUrl: "https://example.org/r", sourceUrlStatus: "confirmed", citation: "Some Author et al. 2020", citationStatus: "ready" }
    expect(getMetadataCurationStatus(record)).toBe("citation_ready")
    expect(canUpgradeToVerifiedMetadata(record)).toBe(false)
  })

  it("license_confirmed without DOI is not verified_metadata", () => {
    const record = { ...pendingRecord, sourceUrl: "https://example.org/r", sourceUrlStatus: "confirmed", citation: "Author 2020", citationStatus: "ready", license: "CC-BY-4.0", licenseStatus: "confirmed" }
    expect(["license_confirmed", "doi_pending"]).toContain(getMetadataCurationStatus(record))
    expect(getMetadataCurationStatus(record)).not.toBe("verified_metadata")
    expect(canUpgradeToVerifiedMetadata(record)).toBe(false)
  })

  it("only reaches verified_metadata when every key field is confirmed and the gate passes", () => {
    const record = {
      ...pendingRecord,
      sourceUrl: "https://example.org/r", sourceUrlStatus: "confirmed",
      citation: "Author 2020", citationStatus: "ready",
      license: "CC-BY-4.0", licenseStatus: "confirmed",
      doi: "10.0000/example", doiStatus: "verified",
      descriptorProvenanceStatus: "complete",
    }
    expect(canUpgradeToVerifiedMetadata(record)).toBe(true)
    expect(getMetadataCurationStatus(record)).toBe("verified_metadata")
  })

  it("does not crash on records missing curation fields and never fabricates pending into verified", () => {
    expect(() => normalizeMetadataCuration({})).not.toThrow()
    const normalized = normalizeMetadataCuration({})
    expect(normalized.curationStatus).toBe("needs_source_review")
    expect(normalized.doiStatus).toBe("pending")
    expect(normalized.canUpgradeToVerifiedMetadata).toBe(false)
    expect(normalized.notFinalRecommendation).toBe(true)
  })

  it("summarizes curation progress with all statuses and remaining blockers", () => {
    const summary = buildCurationProgressSummary([pendingRecord, { ...pendingRecord, recordId: "C2" }])
    expect(summary.queueSize).toBe(2)
    expect(summary.statusCounts.needs_source_review).toBe(2)
    expect(summary.statusCounts.verified_metadata).toBe(0)
    expect(summary.remainingBlockers["DOI pending"]).toBe(2)
    expect(summary.upgradeReadiness.canUpgradeToVerifiedMetadata).toBe(0)
    expect(summary.notFinalRecommendation).toBe(true)
  })
})
