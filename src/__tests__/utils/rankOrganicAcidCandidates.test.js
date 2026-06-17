import { describe, expect, it } from "vitest"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "./organicAcidFixtures"

describe("rankOrganicAcidCandidates", () => {
  it("returns ranked, top, rejected, sanity, sensitivity, and data-gap outputs", () => {
    const result = rankOrganicAcidCandidates({
      candidates: organicAcidFixtureCandidates(),
      scoringMode: "formic_acid_priority",
    })

    expect(result.rankedCandidates[0]).toEqual(expect.objectContaining({
      rank: 1,
      scoreBreakdown: expect.any(Object),
      decisionTrace: expect.any(Array),
    }))
    expect(result.topCandidates.length).toBeGreaterThan(0)
    expect(result.rejectedCandidates.map(row => row.candidateId)).toContain("OA_RISKY")
    expect(result.sanityCheck).toHaveProperty("passed")
    expect(result.sensitivitySummary.rankStability.rows.length).toBeGreaterThan(0)
    expect(result.dataGapSummary).toHaveProperty("syntheticFixtureCount")
  })
})
