// @ts-nocheck
import { describe, expect, it } from "vitest"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import {
  applyHydrothermalGate,
  calculateOACS,
  runOrganicAcidFinalScreening,
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
  })

  it("marks blind-baseline negative evidence as pending when DOI is absent", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.blindBaselineSummary.map(row => row.metal).sort()).toEqual(["Ag", "Pd", "Ru"])
    result.blindBaselineSummary.forEach(row => {
      expect(row.sourceDoi).toBeNull()
      expect(row.negativeEvidenceStatus).toBe("pending verification")
    })
  })
})
