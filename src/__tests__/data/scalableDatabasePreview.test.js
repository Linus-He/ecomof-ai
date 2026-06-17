import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import blockers from "../../../public/data/database_precompute/v2_2/scalable_database_verified_blockers.json"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"

const REQUIRED_FIELDS = [
  "candidateId",
  "displayName",
  "rawName",
  "sourceDatabase",
  "sourceRecordId",
  "sourceVersion",
  "sourceUrl",
  "citation",
  "license",
  "retrievedAt",
  "curationStatus",
  "descriptorCompleteness",
  "fieldSources",
  "surfaceArea",
  "poreSizeA",
  "pldA",
  "lcdA",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "metalNode",
  "linker",
  "topology",
  "evidenceStatus",
  "sourceConfirmed",
  "citationReady",
  "verifiedMetadata",
  "ambiguityWarnings",
  "dataGaps",
]

const REQUIRED_FIELD_SOURCES = [
  "displayName",
  "surfaceArea",
  "poreSizeA",
  "pldA",
  "lcdA",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "metalNode",
  "linker",
  "topology",
]

describe("V2.2 scalable database preview", () => {
  it("contains 500-1000 preview records with required top-level fields", () => {
    expect(records.length).toBeGreaterThanOrEqual(500)
    expect(records.length).toBeLessThanOrEqual(1000)
    expect(summary.totalCandidates).toBe(records.length)
    expect(summary.previewLabel).toBe("Database Preview")
    expect(summary.notFinalRecommendation).toBe(true)
    for (const field of REQUIRED_FIELDS) {
      expect(records[0]).toHaveProperty(field)
    }
  })

  it("preserves field-level provenance for sampled critical fields", () => {
    for (const record of [records[0], records[30], records[records.length - 1]]) {
      for (const field of REQUIRED_FIELD_SOURCES) {
        expect(record.fieldSources[field]).toBeTruthy()
        expect(record.fieldSources[field]).toHaveProperty("sourceDatabase")
        expect(record.fieldSources[field]).toHaveProperty("sourceRecordId")
        expect(record.fieldSources[field]).toHaveProperty("sourceUrl")
        expect(record.fieldSources[field]).toHaveProperty("citation")
        expect(record.fieldSources[field]).toHaveProperty("license")
        expect(record.fieldSources[field]).toHaveProperty("fieldQualityScore")
        expect(record.fieldSources[field]).toHaveProperty("scoringEligible")
        expect(record.fieldSources[field]).toHaveProperty("blocksVerifiedMetadata")
      }
    }
    expect(records[0].fieldSources.density.derivedFrom).toBeTruthy()
    const normalized = records.find(row => row.isSyntheticFixture && row.fieldSources.surfaceArea.normalizationMethod)
    expect(normalized.fieldSources.surfaceArea.status).toBe("normalized")
    expect(normalized.fieldSources.surfaceArea.normalizationMethod).toMatch(/deterministic preview perturbation/)
  })

  it("reaches verified metadata without verifying synthetic fixtures", () => {
    expect(summary.verifiedMetadataCount).toBeGreaterThanOrEqual(1)
    expect(summary.verifiedMetadataCount).toBe(records.filter(row => row.verifiedMetadata).length)
    expect(records.filter(row => row.verifiedMetadata && row.isSyntheticFixture)).toHaveLength(0)
    expect(summary.sourceConfirmedCandidates).toBeGreaterThan(summary.verifiedMetadataCount)
  })

  it("keeps priority Al candidates blocked instead of fabricating evidence", () => {
    expect(blockers.priorityWhyStillZero).toMatch(/MIL-53\(Al\).*CAU-10\(Al\).*MIL-100\(Al\).*DUT-4\(Al\).*MIL-101\(Al\)/)
    expect(blockers.priorityCandidateStatus.find(row => row.displayName === "MIL-101(Al)").quarantined).toBe(true)
    expect(blockers.syntheticFixturePolicy).toMatch(/always blocked/)
  })

  it("keeps 500-1000 candidate funnel counts consistent while dashboard trace remains top limited", () => {
    const trace = buildScreeningTrace({
      model: { candidates: records, weights: [{ key: "d_stab", label: "Stability", weight: 1 }] },
      verification: {
        sourceConfirmedCount: summary.sourceConfirmedCandidates,
        citationReadyCount: summary.citationReadyCandidates,
        verifiedMetadataCount: summary.verifiedMetadataCount,
        quarantinedCount: summary.quarantinedCandidates,
      },
    })
    const ranked = records.filter(row => Number(row.G) !== 0 && !row.quarantined && !(row.ambiguityWarnings || []).length)

    expect(trace.totalCandidates).toBe(records.length)
    expect(trace.finalCandidates).toBe(ranked.length)
    expect(trace.sourceConfirmedCount).toBe(summary.sourceConfirmedCandidates)
    expect(trace.verifiedMetadataCount).toBe(summary.verifiedMetadataCount)
    expect(trace.candidateTraces.length).toBeLessThanOrEqual(100)
    expect(trace.candidateTraces.length).toBeGreaterThan(10)
  })
})
