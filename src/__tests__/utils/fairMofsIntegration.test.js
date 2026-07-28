import { describe, expect, it } from "vitest"
import fairImport from "../../../public/data/data_ingestion/fair_mofs_import_v1.json"
import quality from "../../../public/data/fair_mofs_quality_report.json"
import familyEvidence from "../../../public/data/fair_mofs_family_synthesis_evidence.json"
import propertyIndex from "../../../public/data/fair_mofs_property_index_v1.json"
import ecoscreenSummary from "../../../public/data/fair_mofs_ecoscreen_summary_v1.json"
import rerun from "../../../public/data/organic_acid_rerun_v3_9_10.json"

describe("FAIR-MOFs integration", () => {
  it("preserves source counts, checksums, licence, and identity boundaries", () => {
    expect(fairImport.records).toHaveLength(4168)
    expect(quality.summary.sourceRecordCount).toBe(4168)
    expect(Object.values(quality.checksumValidation).every(row => row.passed)).toBe(true)
    expect(quality.source.license).toBe("CC BY 4.0")
    expect(quality.identityRules.structureIdentity).toMatch(/Exact CSD Refcode/)
    expect(quality.identityRules.doiAssociation).toMatch(/never establishes structure identity/)
    expect(quality.summary.exactRefcodeMatchedFairRecords).toBe(180)
    expect(quality.summary.baseRefcodeMatchedFairRecords).toBe(9)
  })

  it("keeps property missingness and structure identity explicit", () => {
    expect(propertyIndex.records).toHaveLength(4168)
    expect(propertyIndex.summary.exactStructureMatches).toBe(180)
    expect(propertyIndex.summary.variantAssociations).toBe(9)
    expect(propertyIndex.propertyBoundaryEn).toMatch(/missing/i)
    expect(propertyIndex.records.every(row => ["exact-refcode", "base-refcode-variant", "unmatched"].includes(row.match.structureIdentityLevel))).toBe(true)
  })

  it("keeps the lightweight EcoScreen summary aligned with the record-level indexes", () => {
    expect(ecoscreenSummary.processSummary.emittedRecordCount).toBe(fairImport.records.length)
    expect(ecoscreenSummary.propertySummary).toEqual(propertyIndex.summary)
    expect(ecoscreenSummary.processSummary.hardBlockerCoverage).toEqual(expect.objectContaining({
      yield: 0,
      measuredSynthesisEnergy: 0,
      regenerationEnergy: 0,
    }))
  })

  it("uses evidence count for shrinkage and confidence, never as a direct point reward", () => {
    expect(familyEvidence.families.every(row => !row.derivationLevel.includes("frequency") && Number.isFinite(row.evidenceConfidence))).toBe(true)
    expect(familyEvidence.families.filter(row => row.derivationLevel.startsWith("data-derived")).every(row => row.nEffective > 0)).toBe(true)
    expect(rerun.abundanceBiasAudit).toEqual(expect.objectContaining({
      rawFamilyFrequencyUsedAsPointScore: false,
      duplicateCorePointInvariant: true,
      maxDuplicatePointDelta: 0,
    }))
    expect(rerun.hostRanking[0].factorProvenance.synthesizabilityScore.derivationLevel).toMatch(/FAIR-MOFs synthesis-condition accessibility/)
    expect(rerun.boundary).toMatch(/not synthesis-success probability/i)
  })
})
