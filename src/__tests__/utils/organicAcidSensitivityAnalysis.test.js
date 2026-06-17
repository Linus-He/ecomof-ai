import { describe, expect, it } from "vitest"
import { runOrganicAcidSensitivityAnalysis } from "../../utils/organicAcid/organicAcidSensitivityAnalysis"
import { organicAcidCandidate } from "./organicAcidFixtures"

describe("organicAcidSensitivityAnalysis", () => {
  it("identifies unstable candidates when ranking shifts across modes", () => {
    const candidates = [
      organicAcidCandidate({
        id: "PATHWAY_FIRST",
        displayName: "Pathway-first candidate",
        verifiedMetadata: false,
        citationReady: false,
        organicAcidScore: { evidenceLevel: "low", collapseRisk: 0.12 },
        descriptorScores: {
          hydrothermalEvidenceStrength: 0.7,
          thermalStability: 0.7,
          waterBlockingResistance: 0.95,
          poreAccessibility: 0.98,
          c1IntermediateAccessibility: 0.99,
          alOFrameworkRobustness: 0.72,
          linkerMicroenvironmentMatch: 0.98,
          evidenceConfidence: 0.12,
          collapseRisk: 0.12,
        },
      }),
      organicAcidCandidate({
        id: "EVIDENCE_FIRST",
        displayName: "Evidence-first candidate",
        organicAcidScore: { evidenceLevel: "high", collapseRisk: 0.18 },
        descriptorScores: {
          hydrothermalEvidenceStrength: 0.82,
          thermalStability: 0.82,
          waterBlockingResistance: 0.58,
          poreAccessibility: 0.45,
          c1IntermediateAccessibility: 0.35,
          alOFrameworkRobustness: 0.84,
          linkerMicroenvironmentMatch: 0.35,
          evidenceConfidence: 0.96,
          collapseRisk: 0.18,
        },
      }),
      organicAcidCandidate({
        id: "VALIDATION_FIRST",
        displayName: "Validation-first candidate",
        organicAcidScore: { evidenceLevel: "medium", collapseRisk: 0.08 },
        descriptorScores: {
          hydrothermalEvidenceStrength: 0.92,
          thermalStability: 0.9,
          waterBlockingResistance: 0.62,
          poreAccessibility: 0.58,
          c1IntermediateAccessibility: 0.52,
          alOFrameworkRobustness: 0.95,
          linkerMicroenvironmentMatch: 0.48,
          evidenceConfidence: 0.7,
          collapseRisk: 0.08,
        },
      }),
    ]
    const sensitivity = runOrganicAcidSensitivityAnalysis(candidates)

    expect(sensitivity.modes).toContain("formic_acid_priority")
    expect(sensitivity.rankStability.rows.length).toBeGreaterThan(0)
    expect(sensitivity.unstableCandidates.length).toBeGreaterThanOrEqual(1)
    expect(sensitivity.sensitiveDimensions.map(row => row.dimension)).toContain("pathwayFitScore")
  })
})
