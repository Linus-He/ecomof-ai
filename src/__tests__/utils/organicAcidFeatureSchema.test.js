import { describe, expect, it } from "vitest"
import { buildOrganicAcidFeatureSet, ORGANIC_ACID_FEATURE_GROUPS } from "../../utils/organicAcid/organicAcidFeatureSchema"
import { organicAcidCandidate } from "./organicAcidFixtures"

describe("organicAcidFeatureSchema", () => {
  it("builds six feature groups with provenance-bearing scoring fields", () => {
    const features = buildOrganicAcidFeatureSet(organicAcidCandidate())

    expect(Object.keys(ORGANIC_ACID_FEATURE_GROUPS)).toEqual(["structure", "pathway", "evidence", "graph", "dataQuality", "validation"])
    for (const field of ["formicAcidPathwayFit", "collapseRisk", "fieldProvenanceCoverage", "nextExperimentFeasibility"]) {
      expect(features[field]).toEqual(expect.objectContaining({
        unit: expect.any(String),
        source: expect.any(String),
        fieldSource: expect.objectContaining({
          sourceDatabase: expect.any(String),
        }),
        status: "available",
        usedInScoring: true,
        confidence: expect.any(Number),
        weightGroup: expect.any(String),
      }))
    }
    expect(features.formicAcidPathwayFit.fieldSource.derivedFrom).toMatch(/c1IntermediateAccessibility/)
    expect(features.formicAcidPathwayFit.fieldSource.normalizationMethod).toMatch(/0-1/)
  })
})
