import { describe, expect, it } from "vitest"
import { HASH_TO_TAB, getHashMeta, normalizeHash } from "../../utils/deepLinks"

describe("deep links", () => {
  it("routes V2.8 Algorithm Validation Center figure anchors to Methods & Evidence", () => {
    const algorithmValidationHashes = [
      "methodology-algorithm-validation",
      "algval-figure",
      "algval-database",
      "algval-descriptor",
      "algval-feature-selection",
      "algval-evidence",
      "algval-ranking",
      "algval-validation",
      "algval-future-ml",
      "algval-experimental",
    ] as const
    for (const hash of algorithmValidationHashes) {
      expect(HASH_TO_TAB[hash]).toBe("about")
    }
  })

  it("retires the Model Validation Lab and Model Benchmark Lab deep links", () => {
    const hashMap = HASH_TO_TAB as Record<string, string>
    expect(hashMap["methodology-model-validation"]).toBeUndefined()
    expect(hashMap["methodology-model-benchmark"]).toBeUndefined()
  })

  it("has metadata for the Algorithm Validation Center deep link", () => {
    expect(normalizeHash("#methodology-algorithm-validation")).toBe("methodology-algorithm-validation")
    expect(getHashMeta("methodology-algorithm-validation").title).toMatch(/Algorithm Validation Center/i)
    expect(getHashMeta("algval-figure").title).toMatch(/Interactive Scientific Figure/i)
  })

  it("routes Project Evolution as a first-level tab", () => {
    expect(HASH_TO_TAB["project-evolution"]).toBe("projectEvolution")
    expect(HASH_TO_TAB["project-evolution-version-timeline"]).toBe("projectEvolution")
    expect(normalizeHash("#project-evolution")).toBe("project-evolution")
    expect(getHashMeta("project-evolution").title).toMatch(/Project Evolution/i)
  })

  it("retires Research Reports as a first-level tab", () => {
    const hashMap = HASH_TO_TAB as Record<string, string | undefined>
    expect(hashMap["research-reports"]).toBeUndefined()
    expect(hashMap["research-reports-generator"]).toBeUndefined()
    expect(normalizeHash("#research-reports")).toBe("research-reports")
    expect(getHashMeta("research-reports").title).toMatch(/EcoMOF-AI/)
  })
})
