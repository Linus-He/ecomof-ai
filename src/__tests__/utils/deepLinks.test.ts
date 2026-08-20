import { describe, expect, it } from "vitest"
import { HASH_TO_TAB, getHashMeta, normalizeHash } from "../../utils/deepLinks"

describe("deep links", () => {
  it("routes Algorithm Validation Center anchors to its independent page", () => {
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
      expect(HASH_TO_TAB[hash]).toBe("algorithmValidation")
    }
  })

  it("retires the Model Validation Lab and Model Benchmark Lab deep links", () => {
    const hashMap = HASH_TO_TAB as Record<string, string>
    expect(hashMap["methodology-model-validation"]).toBeUndefined()
    expect(hashMap["methodology-model-benchmark"]).toBeUndefined()
  })

  it("has metadata for the Algorithm Validation Center deep link", () => {
    expect(normalizeHash("#methodology-algorithm-validation")).toBe("methodology-algorithm-validation")
    expect(getHashMeta("methodology-algorithm-validation").title).toMatch(/算法验证中心|Algorithm Validation Center/i)
    expect(getHashMeta("algval-figure").title).toMatch(/交互式科研主图|Interactive Scientific Figure/i)
  })

  it("routes legacy Project Evolution links to the split project pages", () => {
    expect(HASH_TO_TAB["project-evolution"]).toBe("releaseNotes")
    expect(HASH_TO_TAB["project-evolution-version-timeline"]).toBe("releaseNotes")
    expect(HASH_TO_TAB["project-evolution-milestones"]).toBe("scientificMilestones")
    expect(HASH_TO_TAB["project-evolution-roadmap"]).toBe("researchRoadmap")
    expect(normalizeHash("#project-evolution")).toBe("project-evolution")
    expect(getHashMeta("project-evolution").title).toMatch(/更新日志|Changelog/i)
  })

  it("routes the creator statement as an independent governance page", () => {
    expect(HASH_TO_TAB["creator-statement"]).toBe("creatorStatement")
    expect(getHashMeta("creator-statement").title).toMatch(/为什么建立 EcoMOF-AI|Creator/i)
  })

  it("routes benchmark references as an independent methods page", () => {
    expect(HASH_TO_TAB["benchmark-references"]).toBe("benchmarkReferences")
    expect(getHashMeta("benchmark-references").title).toMatch(/基准参考|Benchmark References/i)
  })

  it("retires Research Reports as a first-level tab", () => {
    const hashMap = HASH_TO_TAB as Record<string, string | undefined>
    expect(hashMap["research-reports"]).toBeUndefined()
    expect(hashMap["research-reports-generator"]).toBeUndefined()
    expect(normalizeHash("#research-reports")).toBe("research-reports")
    expect(getHashMeta("research-reports").title).toMatch(/EcoMOF-AI/)
  })
})
