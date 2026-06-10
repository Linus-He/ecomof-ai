// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildCuration } from "../../../scripts/build-v2-0-i-curation.mjs"

const queue = Array.from({ length: 18 }, (_, i) => ({
  recordId: `R${i}`,
  displayName: `Candidate ${i}`,
  sourceDatabase: "CoRE MOF",
  sourceRecordId: `COREMOF_${i}`,
  currentVerificationTier: "near_verified",
  descriptorProvenanceStatus: "complete",
}))

describe("build V2.0-I curation", () => {
  it("generates one curation record per queue item without fabricating metadata", () => {
    const { curation, summary } = buildCuration(queue, new Map(), new Map())
    expect(curation.length).toBe(18)
    expect(summary.queueSize).toBe(18)
    expect(curation.every(row => row.doi === null && row.sourceUrl === null && row.license === null && row.citation === null)).toBe(true)
    expect(curation.every(row => row.curationStatus === "needs_source_review")).toBe(true)
    expect(summary.statusCounts.verified_metadata).toBe(0)
    expect(summary.statusCounts.needs_source_review).toBe(18)
  })

  it("preserves manually entered fields on re-run (existing manual value wins)", () => {
    const existing = new Map([
      ["R0", { recordId: "R0", sourceUrl: "https://example.org/r0", sourceUrlStatus: "confirmed", citation: "Author 2020", citationStatus: "ready" }],
    ])
    const { curation } = buildCuration(queue, new Map(), existing)
    const r0 = curation.find(row => row.recordId === "R0")
    expect(r0.sourceUrl).toBe("https://example.org/r0")
    expect(r0.citation).toBe("Author 2020")
    // Source + citation confirmed but license/DOI still pending -> not verified.
    expect(r0.curationStatus).not.toBe("needs_source_review")
    expect(r0.curationStatus).not.toBe("verified_metadata")
    expect(r0.canUpgradeToVerifiedMetadata).toBe(false)
  })
})
