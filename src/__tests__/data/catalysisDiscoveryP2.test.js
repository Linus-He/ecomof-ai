import { describe, expect, it } from "vitest"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import batches from "../../../public/data/catalysis_v2/catalysis_discovery_batches_v1.json"
import queue from "../../../public/data/catalysis_v2/catalysis_candidate_queue_v1.json"
import suggestions from "../../../public/data/catalysis_v2/catalysis_extraction_suggestions_v1.json"
import audit from "../../../public/data/catalysis_v2/catalysis_discovery_audit_v1.json"

describe("catalysis literature discovery P2 datasets", () => {
  it("publishes a reproducible two-adapter, five-family batch", () => {
    expect(batches.schemaVersion).toBe("catalysis-discovery-batches-v1")
    expect(batches.summary).toMatchObject({
      adapterCount: 2,
      familyCount: 5,
      rawHitCount: 250,
      uniqueDoiCount: 155,
      candidateQueueCount: 9,
      individuallyDoiVerifiedCount: 9,
      automaticPromotionCount: 0,
      formalLibrarySourceCount: 10,
    })
    expect(batches.batches).toHaveLength(10)
    expect(batches.batches.every(batch => batch.request.query && batch.responseHash.length === 64)).toBe(true)
  })

  it("keeps every candidate outside the formal reaction library", () => {
    const formalDois = new Set(database.tables.sourceDocuments.map(source => source.doi))
    expect(queue.candidates).toHaveLength(9)
    expect(queue.candidates.every(candidate => !formalDois.has(candidate.doi))).toBe(true)
    expect(queue.candidates.every(candidate => candidate.formalLibraryEligible === false)).toBe(true)
    expect(queue.candidates.every(candidate => candidate.doiVerification.metadataMatch.status === "matched")).toBe(true)
    expect(database.summary.sourceDocumentCount).toBe(10)
  })

  it("separates review navigation, correction notices, and catalyst-state boundaries", () => {
    expect(queue.navigationCandidates).toHaveLength(1)
    expect(queue.navigationCandidates[0]).toMatchObject({ doi: "10.3390/catal13071109", documentRole: "review-article" })
    expect(queue.candidates.some(candidate => /corrigendum/i.test(candidate.title))).toBe(false)
    expect(queue.candidates.find(candidate => candidate.doi === "10.1016/j.cej.2022.138164").familyId).toBe("co2rr-formate-mof-enzyme-hybrid")
    expect(queue.candidates.find(candidate => candidate.doi === "10.1016/j.cjche.2022.03.006").manualReview.catalystStateOverride).toBe("reconstructed-mof-derived-material")
  })

  it("makes every machine suggestion non-promotable and audits the isolation", () => {
    expect(suggestions.suggestions).toHaveLength(queue.candidates.length)
    expect(suggestions.suggestions.every(row => row.reviewStatus === "suggested-not-verified")).toBe(true)
    expect(suggestions.suggestions.every(row => row.verificationLevel === "unverified")).toBe(true)
    expect(suggestions.suggestions.every(row => row.promotionAllowed === false && row.formalLibraryWriteAllowed === false)).toBe(true)
    expect(audit.result).toBe("passed-with-quarantined-candidates")
    expect(audit.checks.every(check => check.status === "passed")).toBe(true)
  })
})
