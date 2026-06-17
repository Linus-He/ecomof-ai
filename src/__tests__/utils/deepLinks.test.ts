import { describe, expect, it } from "vitest"
import { HASH_TO_TAB, getHashMeta, normalizeHash } from "../../utils/deepLinks"

describe("deep links", () => {
  it("routes V2.3 Model Validation Lab anchors to Methods & Evidence", () => {
    const modelValidationHashes = [
      "methodology-model-validation",
      "methodology-project-evolution-integration",
      "methodology-model-feature-pipeline",
      "methodology-feature-selection-explorer",
      "methodology-model-comparison-dashboard",
      "methodology-explainability-trust-map",
      "methodology-validation-workflow",
      "methodology-confidence-analysis",
    ] as const
    for (const hash of modelValidationHashes) {
      expect(HASH_TO_TAB[hash]).toBe("about")
    }
  })

  it("has metadata for the Model Validation Lab deep link", () => {
    expect(normalizeHash("#methodology-model-validation")).toBe("methodology-model-validation")
    expect(getHashMeta("methodology-model-validation").title).toMatch(/Model Validation Lab/i)
  })

  it("routes Project Evolution as a first-level tab", () => {
    expect(HASH_TO_TAB["project-evolution"]).toBe("projectEvolution")
    expect(HASH_TO_TAB["project-evolution-version-timeline"]).toBe("projectEvolution")
    expect(normalizeHash("#project-evolution")).toBe("project-evolution")
    expect(getHashMeta("project-evolution").title).toMatch(/Project Evolution/i)
  })

  it("routes Research Reports as a first-level tab", () => {
    expect(HASH_TO_TAB["research-reports"]).toBe("researchReports")
    expect(HASH_TO_TAB["research-reports-generator"]).toBe("researchReports")
    expect(normalizeHash("#research-reports")).toBe("research-reports")
    expect(getHashMeta("research-reports").title).toMatch(/研究报告|Research Reports/i)
  })
})
