import { describe, expect, it } from "vitest"
import { buildDataQualityAudit, enrichRecordQuality } from "../../utils/dataQualityAudit"

const source = {
  sourceDatabase: "CoRE MOF DB",
  sourceRecordId: "core-row",
  sourceUrl: "https://example.org/core.csv",
  citation: "Core citation DOI:10.0000/core.",
  license: "CC-BY-4.0",
  retrievedAt: "2026-06-17",
  curationStatus: "raw-import",
}

function field(value, status = "confirmed", extra = {}) {
  return { ...source, value, status, ...extra }
}

function baseRecord(extra = {}) {
  return {
    candidateId: "CORE-1",
    displayName: "CORE-1",
    rawName: "CORE-1",
    sourceDatabase: source.sourceDatabase,
    sourceRecordId: source.sourceRecordId,
    sourceUrl: source.sourceUrl,
    citation: source.citation,
    license: source.license,
    retrievedAt: source.retrievedAt,
    sourceConfirmed: true,
    sourceUrlStatus: "confirmed",
    licenseStatus: "confirmed",
    citationStatus: "confirmed",
    fixtureRecordMappingStatus: "confirmed",
    surfaceArea: 1200,
    poreSizeA: 8,
    poreVolume: 1.4,
    density: 0.8,
    fieldSources: {
      displayName: field("CORE-1"),
      rawName: field("CORE-1"),
      sourceDatabase: field(source.sourceDatabase),
      sourceRecordId: field(source.sourceRecordId),
      sourceUrl: field(source.sourceUrl),
      citation: field(source.citation),
      license: field(source.license),
      surfaceArea: field(1200),
      poreSizeA: field(8),
      poreVolume: field(1.4),
      density: field(0.8, "derived", { derivedFrom: ["source specific volume"] }),
    },
    ...extra,
  }
}

describe("dataQualityAudit", () => {
  it("summarizes missing, pending, ambiguous, source, citation, license, DOI, and synthetic counts", () => {
    const verified = enrichRecordQuality(baseRecord({ verifiedMetadata: true }))
    const blocked = enrichRecordQuality(baseRecord({
      candidateId: "CORE-2",
      verifiedMetadata: false,
      sourceConfirmed: true,
      ambiguityWarnings: ["topology ambiguous"],
      fieldSources: {
        ...baseRecord().fieldSources,
        topology: field("ambiguous topology", "ambiguous", { hasAmbiguity: true }),
        bandGap: field(null, "missing", { missingReason: "Not in source." }),
        linker: field("pending", "pending"),
      },
    }))
    const synthetic = enrichRecordQuality(baseRecord({
      candidateId: "SYN-1",
      verifiedMetadata: false,
      isSyntheticFixture: true,
      fixtureRecordMappingStatus: "synthetic_fixture",
      fieldSources: {
        ...baseRecord().fieldSources,
        displayName: field("SYN-1", "synthetic"),
      },
    }))

    const audit = buildDataQualityAudit([verified, blocked, synthetic])

    expect(audit.summary.totalCandidates).toBe(3)
    expect(audit.summary.sourceConfirmedCount).toBe(3)
    expect(audit.summary.verifiedMetadataCount).toBe(1)
    expect(audit.summary.sourceConfirmedCount).not.toBe(audit.summary.verifiedMetadataCount)
    expect(audit.summary.licenseConfirmedCount).toBe(3)
    expect(audit.summary.sourceUrlConfirmedCount).toBe(3)
    expect(audit.summary.doiConfirmedCount).toBe(3)
    expect(audit.summary.syntheticFixtureCount).toBe(1)
    expect(audit.summary.ambiguityWarningCount).toBeGreaterThan(0)
    expect(audit.summary.missingFieldCount).toBeGreaterThan(0)
    expect(audit.blockerCounts["synthetic fixture"]).toBe(1)
    expect(audit.fieldCoverage.find(row => row.field === "topology").ambiguous).toBeGreaterThan(0)
    expect(audit.fieldCoverage.find(row => row.field === "bandGap").missing).toBeGreaterThan(0)
  })
})
