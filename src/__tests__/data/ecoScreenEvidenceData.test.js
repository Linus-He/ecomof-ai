import { describe, expect, it } from "vitest"
import evidence from "../../../public/data/ecoscreen_candidate_process_evidence_v1.json"
import evidenceSummary from "../../../public/data/ecoscreen_candidate_process_evidence_summary_v1.json"
import registry from "../../../public/data/ecoscreen_evidence_source_registry_v1.json"
import baselines from "../../../public/data/ecoscreen_regional_baselines_v1.json"

describe("EcoScreen candidate evidence and regional baselines", () => {
  it("keeps the FAIR-MOFs full dataset and lightweight summary synchronized", () => {
    expect(evidence.schemaVersion).toBe("ecoscreen-candidate-process-evidence-v1")
    expect(evidence.records).toHaveLength(4168)
    expect(evidence.summary).toEqual(evidenceSummary.summary)
    expect(evidence.summary.recordsWithDoi).toBe(evidence.records.length)
    expect(evidence.summary.recordsWithAtLeastFiveProcessFields).toBe(3782)
    expect(new Set(evidence.records.map(row => row.candidateId)).size).toBe(evidence.records.length)
    expect(evidence.records.every(row => row.doi && row.sourceRecordId)).toBe(true)
  })

  it("keeps candidate evidence honest about missing comparison-critical measurements", () => {
    const hardCoverage = evidence.summary.hardBlockerCoverage
    expect(hardCoverage).toEqual({
      yield: 0,
      massBalance: 0,
      measuredSynthesisEnergy: 0,
      solventRecovery: 0,
      workingCapacity: 0,
      cycleStability: 0,
      regenerationEnergy: 0,
    })
    expect(evidence.records.every(row => row.lcaInventoryEligible === false)).toBe(true)
    expect(evidence.records.every(row => row.serviceComparisonEligible === false)).toBe(true)
    expect(evidence.evidenceBoundaryZh).toMatch(/硬门控/)
  })

  it("registers complementary structure, recipe, adsorption, computed, and background-LCI layers", () => {
    expect(registry.sources.map(source => source.id)).toEqual(expect.arrayContaining([
      "FAIR-MOFS-2025",
      "CORE-MOF-2024-CSD-MODIFIED-CR",
      "NIST-ISODB",
      "MOFX-DB",
      "FEDERAL-LCA-COMMONS",
      "DIGIMOF",
      "SYNMOF",
    ]))
    expect(registry.qualityRules.candidateComparisonHardBlockers).toContain("measuredSynthesisEnergy")
    expect(registry.qualityRules.serviceComparisonHardBlockers).toContain("cycleStability")
  })

  it("defines switchable China and international profiles with explicit sources and scenario costs", () => {
    expect(baselines.defaultBaselineId).toBe("china")
    expect(baselines.profiles.map(profile => profile.id)).toEqual(["china", "global"])
    for (const profile of baselines.profiles) {
      expect(profile.gridGwpKgCo2ePerKwh).toBeGreaterThan(0)
      expect(profile.currency).toBeTruthy()
      expect(profile.sourceIds.length).toBeGreaterThan(0)
      expect(profile.electricityPricePerKwh).toBeGreaterThan(0)
      expect(profile.electricityPriceSourceType).toMatch(/scenario/)
      expect(profile.currencyPerUsd).toBeGreaterThan(0)
    }
    expect(baselines.sources.map(source => source.id)).toEqual(expect.arrayContaining([
      "CN-MEE-NBS-GRID-2023",
      "IEA-ELECTRICITY-2026",
    ]))
  })
})
