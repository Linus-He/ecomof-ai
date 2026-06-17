import { describe, expect, it } from "vitest"
import { runOrganicAcidSanityCheck } from "../../utils/organicAcid/organicAcidSanityCheck"
import { scoreOrganicAcidCandidate } from "../../utils/organicAcid/scoreOrganicAcidCandidate"
import { organicAcidCandidate } from "./organicAcidFixtures"

describe("organicAcidSanityCheck", () => {
  it("warns when a very low evidence candidate is ranked first", () => {
    const candidate = scoreOrganicAcidCandidate(organicAcidCandidate({
      id: "LOW_EVIDENCE_TOP",
      organicAcidScore: { evidenceLevel: "very low", collapseRisk: 0.1 },
    }), { rank: 1 })
    const sanity = runOrganicAcidSanityCheck([{ ...candidate, rank: 1 }])

    expect(sanity.warnings.map(row => row.ruleId)).toContain("very-low-evidence-rank-one")
  })
})
