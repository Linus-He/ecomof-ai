// @ts-nocheck
import { describe, expect, it } from "vitest"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import {
  applyHydrothermalGate,
  buildCandidateDecisionTrace,
  calculateDMRS,
  calculateOACS,
  METAL_DESCRIPTOR_KEYS,
  runOrganicAcidFinalScreening,
  runFullMetalSensitivityDistribution,
} from "../../utils/organicAcidFinalScreening"

describe("organic acid final screening", () => {
  it("applies the hydrothermal hard gate before OACS ranking", () => {
    const passed = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_001"), rules), rules.frameworkWeights)
    const failed = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_009"), rules), rules.frameworkWeights)
    const review = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_008"), rules), rules.frameworkWeights)

    expect(passed.hydrothermalGate.status).toBe("pass")
    expect(passed.organicAcidScore.oacs).toBeGreaterThan(0)
    expect(failed.hydrothermalGate.status).toBe("fail")
    expect(failed.organicAcidScore.oacs).toBe(0)
    expect(review.hydrothermalGate.status).toBe("needs_review")
    expect(review.organicAcidScore.oacs).toBe(0)
  })

  it("keeps Mo as a second-metal recommendation outcome with robust sensitivity", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const mo = result.moRecommendation

    expect(result.rankedFrameworks.filter(row => row.hydrothermalGate.status === "pass").length).toBeGreaterThanOrEqual(5)
    expect(mo).toBeTruthy()
    expect(mo.mostLikelyForm).toMatch(/Mo-oxo|MoOx-like/)
    expect(mo.mechanism.nodeSubstitution.level).toBe("low")
    expect(result.sensitivity.targetMetal.metal).toBe("Mo")
    expect(result.sensitivity.targetMetal.top3Probability).toBeGreaterThanOrEqual(0.85)
    expect(result.moRobustnessAudit.status).toBe("audit_required")
    expect(result.moRobustnessAudit.reason).toMatch(/not definitive proof|不是/)
  })

  it("marks blind-baseline negative evidence as pending when DOI is absent", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.blindBaselineSummary.map(row => row.metal).sort()).toEqual(["Ag", "Pd", "Ru"])
    result.blindBaselineSummary.forEach(row => {
      expect(row.sourceDoi).toBeNull()
      expect(row.negativeEvidenceStatus).toBe("pending verification")
    })
  })

  it("scores structured metal descriptors instead of falling back to zero", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const selectedFramework = result.selectedFramework
    const moSource = metals.find(row => row.metal === "Mo")
    const mo = calculateDMRS(moSource, selectedFramework, rules.dopantWeights)

    METAL_DESCRIPTOR_KEYS.forEach(key => {
      expect(moSource[key]).toEqual(expect.objectContaining({
        value: expect.any(Number),
        sourceBasis: expect.any(String),
        confidence: expect.any(String),
        sourceDoi: null,
        note: expect.any(String),
      }))
    })
    expect(mo.activeSiteValue).toBeGreaterThan(0.7)
    expect(mo.dmrs).toBeGreaterThan(0.6)
  })

  it("runs a full-metal sensitivity distribution with validated perturbations", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const distribution = runFullMetalSensitivityDistribution(metals, result.selectedFramework, rules.dopantWeights, 120, {
      perturbationRange: 0.2,
      robustTop3Threshold: 0.85,
      seed: 170,
    })

    expect(distribution.validation.status).toBe("valid")
    expect(distribution.validation.withinRange).toBe(true)
    expect(distribution.validation.normalized).toBe(true)
    expect(distribution.summaries).toHaveLength(metals.length)
    expect(distribution.summaries.find(row => row.metal === "Mo")).toEqual(expect.objectContaining({
      top1Probability: 1,
      rankRange: "1-1",
      rankProbabilities: expect.objectContaining({ rank1: 1 }),
    }))
    expect(result.fullMetalSensitivityDistribution).toHaveLength(metals.length)
  })

  it("reports competitor diagnostics and provenance coverage without fake DOI", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.competitiveMetalComparison.map(row => row.competitor).sort()).toEqual(["Fe", "Ti", "V", "W", "Zr"])
    expect(result.competitiveMetalComparison.find(row => row.competitor === "W").dmrsGap).toBeGreaterThan(0)
    expect(result.provenanceCoverage.structuredValueCoverage).toBe(1)
    expect(result.provenanceCoverage.sourceBasisCoverage).toBe(1)
    expect(result.provenanceCoverage.confidenceCoverage).toBe(1)
    expect(result.provenanceCoverage.doiCoverage).toBe(0)
    expect(result.provenanceCoverage.fakeDoiCount).toBe(0)
    expect(result.provenanceCoverage.noFakeDoiPolicyActive).toBe(true)
  })

  it("builds the V1.2 algorithm journey UI data without changing conclusions", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.algorithmJourneySteps).toHaveLength(7)
    expect(result.algorithmJourneySteps.map(row => row.id)).toEqual([
      "reaction-constraints",
      "hydrothermal-gate",
      "oacs-framework-ranking",
      "dmrs-dopant-recommendation",
      "robustness-audit",
      "exafs-falsification",
      "experimental-controls",
    ])
    expect(result.algorithmJourneySteps.find(row => row.id === "robustness-audit").status).toBe("warning")
    expect(result.screeningFunnelData.map(row => [row.label, row.count])).toEqual([
      ["Raw demo framework pool", 24],
      ["Al-MOF candidates", 24],
      ["Hydrothermal gate pass", 9],
      ["OACS-ranked candidates", 9],
      ["Selected scaffold", 1],
      ["Dopant metals evaluated", 14],
      ["High-priority dopants", 2],
      ["Experimental hypothesis", 1],
    ])
    expect(result.stageSummary.stage1.oacs).toBe(0.631)
    expect(result.stageSummary.stage2.moWGap).toBe(0.027)
    expect(result.mechanismRadarData.map(row => row.metal)).toEqual(["Mo", "W", "V", "Fe", "Ti", "Zr"])
    expect(result.sensitivityRankBars.find(row => row.metal === "Mo").rankProbabilities.rank1).toBe(1)
    expect(result.algorithmTrace).toHaveLength(9)
    expect(result.algorithmTrace.map(row => row.id)).toContain("falsifiable-hypothesis")
  })

  it("builds candidate decision traces for pass, fail, and needs-review candidates", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const passed = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "pass"))
    const failed = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "fail"))
    const review = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "needs_review"))

    expect(passed.decision).toBe("passed")
    expect(failed.decision).toBe("failed")
    expect(failed.reasons).toContain("OACS forced to 0")
    expect(failed.reasonsZh).toContain("高比表面积不能抵消水热稳定性失败。")
    expect(review.decision).toBe("needs_review")
    expect(review.penalties).toContain("OACS forced to 0")
  })
})
