import { describe, expect, it } from "vitest"
import { computeFieldQualityScore, enrichRecordQuality } from "../../utils/dataQualityAudit"

const source = {
  sourceDatabase: "CoRE MOF DB",
  sourceRecordId: "core-row-1",
  sourceUrl: "https://example.org/source.csv",
  citation: "Source citation DOI:10.0000/example.",
  license: "CC-BY-4.0",
  retrievedAt: "2026-06-17",
  curationStatus: "raw-import",
}

describe("fieldQualityScore", () => {
  it("maps V2.2 field quality statuses to required scores", () => {
    expect(computeFieldQualityScore("confirmed")).toBe(1)
    expect(computeFieldQualityScore("normalized")).toBe(0.8)
    expect(computeFieldQualityScore("derived")).toBe(0.7)
    expect(computeFieldQualityScore("pending")).toBe(0.4)
    expect(computeFieldQualityScore("ambiguous")).toBe(0.2)
    expect(computeFieldQualityScore("missing")).toBe(0)
    expect(computeFieldQualityScore("synthetic")).toBe(0)
    expect(computeFieldQualityScore("not_available")).toBe(0)
  })

  it("adds per-field quality score, derivedFrom, normalization method, and missing reason", () => {
    const row = enrichRecordQuality({
      candidateId: "TEST-1",
      displayName: "TEST-1",
      rawName: "TEST-1",
      sourceDatabase: source.sourceDatabase,
      sourceRecordId: source.sourceRecordId,
      sourceUrl: source.sourceUrl,
      citation: source.citation,
      license: source.license,
      retrievedAt: source.retrievedAt,
      surfaceArea: 1000,
      poreSizeA: 8,
      poreVolume: 1.2,
      density: 0.9,
      bandGap: null,
      fieldSources: {
        displayName: { ...source, value: "TEST-1", status: "confirmed" },
        rawName: { ...source, value: "TEST-1", status: "confirmed" },
        sourceDatabase: { ...source, value: source.sourceDatabase, status: "confirmed" },
        sourceRecordId: { ...source, value: source.sourceRecordId, status: "confirmed" },
        sourceUrl: { ...source, value: source.sourceUrl, status: "confirmed" },
        citation: { ...source, value: source.citation, status: "confirmed" },
        license: { ...source, value: source.license, status: "confirmed" },
        surfaceArea: { ...source, value: 1000, status: "confirmed" },
        poreSizeA: { ...source, value: 8, status: "normalized", normalizationMethod: "unit normalized" },
        poreVolume: { ...source, value: 1.2, status: "confirmed" },
        density: { ...source, value: 0.9, status: "derived", derivedFrom: ["source specific volume"] },
        bandGap: { ...source, value: null, status: "missing", missingReason: "Not present in source row." },
      },
    })

    expect(row.fieldSources.surfaceArea.fieldQualityScore).toBe(1)
    expect(row.fieldSources.poreSizeA.fieldQualityScore).toBe(0.8)
    expect(row.fieldSources.poreSizeA.normalizationMethod).toBe("unit normalized")
    expect(row.fieldSources.density.fieldQualityScore).toBe(0.7)
    expect(row.fieldSources.density.derivedFrom).toEqual(["source specific volume"])
    expect(row.fieldSources.bandGap.fieldQualityScore).toBe(0)
    expect(row.fieldSources.bandGap.missingReason).toMatch(/Not present/)
  })
})
