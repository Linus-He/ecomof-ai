import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DataQualityAuditPanel } from "../../components/data-quality/DataQualityAuditPanel"

const source = {
  sourceDatabase: "CoRE MOF DB",
  sourceRecordId: "core-row",
  sourceUrl: "https://example.org/core.csv",
  citation: "Citation DOI:10.0000/core.",
  license: "CC-BY-4.0",
  retrievedAt: "2026-06-17",
  curationStatus: "raw-import",
}

function record(id, fieldOverrides = {}) {
  return {
    candidateId: id,
    displayName: id,
    rawName: id,
    ...source,
    sourceConfirmed: true,
    sourceUrlStatus: "confirmed",
    licenseStatus: "confirmed",
    citationStatus: "confirmed",
    fixtureRecordMappingStatus: "confirmed",
    surfaceArea: 1200,
    poreSizeA: 8,
    poreVolume: 1.1,
    density: 0.8,
    fieldSources: {
      displayName: { ...source, value: id, status: "confirmed" },
      rawName: { ...source, value: id, status: "confirmed" },
      sourceDatabase: { ...source, value: source.sourceDatabase, status: "confirmed" },
      sourceRecordId: { ...source, value: source.sourceRecordId, status: "confirmed" },
      sourceUrl: { ...source, value: source.sourceUrl, status: "confirmed" },
      citation: { ...source, value: source.citation, status: "confirmed" },
      license: { ...source, value: source.license, status: "confirmed" },
      surfaceArea: { ...source, value: 1200, status: "confirmed" },
      poreSizeA: { ...source, value: 8, status: "pending" },
      poreVolume: { ...source, value: null, status: "missing", missingReason: "Not present." },
      density: { ...source, value: 0.8, status: "derived", derivedFrom: ["specific volume"] },
      topology: { ...source, value: "ambiguous", status: "ambiguous", hasAmbiguity: true },
      ...fieldOverrides,
    },
  }
}

function bodyText() {
  return document.body.textContent || ""
}

describe("DataQualityAuditPanel", () => {
  it("displays missing, pending, ambiguous, export buttons, and preview boundary", () => {
    render(<DataQualityAuditPanel records={[record("R1")]} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("data-quality-audit-panel")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Data Quality Audit/i)
    expect(bodyText()).toMatch(/Database Preview \/ Not Final Recommendation/i)
    expect(bodyText()).toMatch(/pending/i)
    expect(bodyText()).toMatch(/ambiguous/i)
    expect(bodyText()).toMatch(/missing/i)
    expect(screen.getByText("Export Screening Audit JSON")).toBeInTheDocument()
    expect(screen.getByText("Export Candidate Data Gap JSON")).toBeInTheDocument()
    expect(screen.getByText("Export Model Readiness Summary JSON")).toBeInTheDocument()
  })
})
