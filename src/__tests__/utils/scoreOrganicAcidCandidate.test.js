import { describe, expect, it } from "vitest"
import { resolveOrganicAcidScoringMode } from "../../utils/organicAcid/organicAcidScoringWeights"
import { scoreOrganicAcidCandidate } from "../../utils/organicAcid/scoreOrganicAcidCandidate"
import { organicAcidCandidate } from "./organicAcidFixtures"

describe("scoreOrganicAcidCandidate", () => {
  it("uses formic_acid_priority mode to increase pathway weight and score a candidate", () => {
    const balanced = resolveOrganicAcidScoringMode("balanced")
    const formic = resolveOrganicAcidScoringMode("formic_acid_priority")
    const scored = scoreOrganicAcidCandidate(organicAcidCandidate(), { scoringMode: "formic_acid_priority" })

    expect(formic.weights.pathwayFitScore).toBeGreaterThan(balanced.weights.pathwayFitScore)
    expect(scored.finalScore).toBeGreaterThan(0.5)
    expect(scored.scoreBreakdown.equation).toMatch(/riskPenalty/)
    expect(scored.decisionTrace.map(step => step.step)).toEqual([
      "Candidate Loaded",
      "Feature Availability Check",
      "Pathway Fit Calculation",
      "Evidence Adjustment",
      "Graph Relevance Calculation",
      "Structure Suitability Calculation",
      "Risk Penalty Applied",
      "Validation Readiness Check",
      "Final Ranking",
      "Next Experiment Generated",
    ])
  })

  it("lowers dataQualityScore when missingCriticalFields are present", () => {
    const scored = scoreOrganicAcidCandidate(organicAcidCandidate({
      sourceDatabase: "",
      sourceRecordId: "",
      descriptorScores: {},
    }))

    expect(scored.dataQualityScore).toBeLessThan(0.7)
    expect(scored.dataGapSummary.missingCriticalFields).toBeGreaterThan(0)
  })
})
