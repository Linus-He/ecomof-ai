// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildMetadataVerificationQueue,
  getMetadataVerificationTier,
  isVerifiedRecommendationEligible,
  normalizeMetadataVerification,
} from "../../utils/databaseIndex/metadataVerification"

// Traceable source + complete descriptor provenance + retrievedAt, DOI/license pending.
const nearVerifiedRecord = {
  recordId: "NV1",
  displayName: "Near verified candidate",
  sourceDatabase: "CoRE MOF",
  sourceRecordId: "COREMOF_000010",
  retrievedAt: "2026-06",
  metadataVerification: { descriptorProvenanceStatus: "complete" },
}

describe("metadata verification near_verified tier", () => {
  it("classifies a traceable, provenance-complete, DOI/license-pending record as near_verified", () => {
    expect(getMetadataVerificationTier(nearVerifiedRecord)).toBe("near_verified")
  })

  it("near_verified is not verified_metadata and is not a final recommendation", () => {
    const verification = normalizeMetadataVerification(nearVerifiedRecord)
    expect(verification.verificationTier).toBe("near_verified")
    expect(verification.verificationLevel).not.toBe("verified_metadata")
    expect(isVerifiedRecommendationEligible(nearVerifiedRecord)).toBe(false)
  })

  it("does not mark a record near_verified when source and citation are missing", () => {
    const record = { recordId: "X", metadataVerification: { descriptorProvenanceStatus: "complete", sourceUrlStatus: "missing", citationStatus: "missing" } }
    expect(getMetadataVerificationTier(record)).not.toBe("near_verified")
  })

  it("does not crash on legacy rows without metadata fields", () => {
    expect(() => getMetadataVerificationTier({})).not.toThrow()
    expect(getMetadataVerificationTier({})).toBeTruthy()
  })
})

describe("metadata verification queue", () => {
  const records = [
    ...Array.from({ length: 14 }, (_, i) => ({ recordId: `NV${i}`, displayName: `Near ${i}`, sourceDatabase: "CoRE MOF", sourceRecordId: `R${i}`, retrievedAt: "2026-06", metadataVerification: { descriptorProvenanceStatus: "complete" } })),
    ...Array.from({ length: 8 }, (_, i) => ({ recordId: `PV${i}`, displayName: `Preview ${i}`, sourceDatabase: "CoRE MOF", sourceRecordId: `P${i}`, metadataVerification: { descriptorProvenanceStatus: "partial" } })),
  ]

  it("selects 10-20 priority candidates with blocking reasons and no fabricated metadata", () => {
    const { queue, summary } = buildMetadataVerificationQueue(records)
    expect(queue.length).toBeGreaterThanOrEqual(10)
    expect(queue.length).toBeLessThanOrEqual(20)
    expect(queue.every(item => item.doi === null && item.license === null && item.sourceUrl === null)).toBe(true)
    expect(queue.every(item => item.verificationAction === "needs_manual_review")).toBe(true)
    expect(queue.every(item => item.blockingReasons.length > 0)).toBe(true)
  })

  it("summarizes priority, proposed tiers, and never proposes verified_metadata", () => {
    const { summary } = buildMetadataVerificationQueue(records)
    expect(summary.proposedTierCounts.verified_metadata).toBe(0)
    expect(summary.priorityCounts.high).toBeGreaterThan(0)
    expect(summary.mostCommonBlockingReasons.length).toBeGreaterThan(0)
    expect(summary.manualReviewRequired).toBe(summary.queueSize)
  })
})
