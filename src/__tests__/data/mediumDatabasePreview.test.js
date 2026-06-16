// @ts-nocheck
import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_1/medium_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_1/medium_database_preview_summary.json"
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

const FIELD_SOURCE_KEYS = [
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
  "evidenceLevel",
  "sourceStatus",
  "verifiedMetadataStatus",
]

describe("V2.1 medium database preview", () => {
  it("contains 200-500 records with required fields and field-level provenance", () => {
    expect(records.length).toBeGreaterThanOrEqual(200)
    expect(records.length).toBeLessThanOrEqual(500)
    for (const record of records) {
      for (const key of REQUIRED_FIELDS) expect(record, `${record.candidateId} missing ${key}`).toHaveProperty(key)
      expect(record.candidateId).toMatch(/^SYNTHETIC_FIXTURE_MDBP_/)
      for (const field of FIELD_SOURCE_KEYS) {
        const source = record.fieldSources[field]
        expect(source, `${record.candidateId} missing fieldSources.${field}`).toBeTruthy()
        expect(source).toEqual(expect.objectContaining({
          value: expect.anything(),
          sourceDatabase: expect.any(String),
          sourceRecordId: expect.any(String),
          sourceUrl: expect.any(String),
          citation: expect.any(String),
          license: expect.any(String),
          retrievedAt: expect.any(String),
          curationStatus: expect.any(String),
          confidence: expect.any(Number),
          status: expect.any(String),
          scoringEligible: expect.any(Boolean),
          blocksVerifiedMetadata: expect.any(Boolean),
        }))
      }
    }
  })

  it("keeps verified metadata at zero and labels the set as Database Preview", () => {
    expect(summary.previewLabel).toBe("Database Preview")
    expect(summary.notFinalRecommendation).toBe(true)
    expect(summary.verifiedMetadataCount).toBe(0)
    expect(records.every(record => record.verifiedMetadata === false)).toBe(true)
    expect(records.every(record => record.notFinalRecommendation === true)).toBe(true)
    expect(JSON.stringify(records)).not.toMatch(/verified screening complete/i)
  })

  it("keeps pending and ambiguous fields out of verified metadata", () => {
    const pendingSources = records.flatMap(record => Object.values(record.fieldSources)).filter(source => ["pending", "ambiguous", "missing"].includes(source.status))
    expect(pendingSources.length).toBeGreaterThan(0)
    expect(pendingSources.every(source => source.blocksVerifiedMetadata)).toBe(true)
  })

  it("feeds consistent counts into the screening funnel", () => {
    const trace = buildScreeningTrace({ model: { candidates: records, weights: [{ key: "d_stab", weight: 1 }] }, verification: { verifiedMetadataCount: 0 } })
    expect(trace.totalCandidates).toBe(records.length)
    expect(trace.funnel[0].inputCount).toBe(records.length)
    expect(trace.verifiedMetadataCount).toBe(0)
    expect(trace.notFinalRecommendation).toBe(true)
  })
})
