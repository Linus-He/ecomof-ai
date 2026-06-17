import { describe, expect, it } from "vitest"
import { calculateOrganicAcidRiskPenalty } from "../../utils/organicAcid/calculateOrganicAcidRiskPenalty"
import { buildOrganicAcidFeatureSet } from "../../utils/organicAcid/organicAcidFeatureSchema"
import { organicAcidCandidate } from "./organicAcidFixtures"

describe("calculateOrganicAcidRiskPenalty", () => {
  it("penalizes high collapseRisk and reports blocking risk", () => {
    const features = buildOrganicAcidFeatureSet(organicAcidCandidate({
      descriptorScores: { collapseRisk: 0.9, waterBlockingResistance: 0.3 },
      hydrothermalGate: { status: "fail" },
    }))
    const penalty = calculateOrganicAcidRiskPenalty(features)

    expect(penalty.totalPenalty).toBeGreaterThan(0.18)
    expect(penalty.blockingRisks.map(row => row.key)).toContain("collapseRisk")
    expect(penalty.explanation).toMatch(/collapseRisk/)
  })
})
