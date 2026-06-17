import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { FieldCoverageMatrix } from "../../components/data-quality/DataQualityAuditPanel"
import { buildDataQualityAudit } from "../../utils/dataQualityAudit"

const source = {
  sourceDatabase: "CoRE MOF DB",
  sourceRecordId: "core-row",
  sourceUrl: "https://example.org/core.csv",
  citation: "Citation DOI:10.0000/core.",
  license: "CC-BY-4.0",
  retrievedAt: "2026-06-17",
  curationStatus: "raw-import",
}

const record = {
  candidateId: "R1",
  displayName: "R1",
  rawName: "R1",
  ...source,
  surfaceArea: 1200,
  poreSizeA: 8,
  poreVolume: null,
  density: 0.8,
  fieldSources: {
    displayName: { ...source, value: "R1", status: "confirmed" },
    rawName: { ...source, value: "R1", status: "confirmed" },
    sourceDatabase: { ...source, value: source.sourceDatabase, status: "confirmed" },
    sourceRecordId: { ...source, value: source.sourceRecordId, status: "confirmed" },
    sourceUrl: { ...source, value: source.sourceUrl, status: "confirmed" },
    citation: { ...source, value: source.citation, status: "confirmed" },
    license: { ...source, value: source.license, status: "confirmed" },
    surfaceArea: { ...source, value: 1200, status: "confirmed" },
    poreSizeA: { ...source, value: 8, status: "normalized", normalizationMethod: "unit normalized" },
    poreVolume: { ...source, value: null, status: "missing", missingReason: "Not present." },
    density: { ...source, value: 0.8, status: "derived", derivedFrom: ["specific volume"] },
  },
}

describe("FieldCoverageMatrix", () => {
  it("renders field status columns and key descriptor rows", () => {
    const audit = buildDataQualityAudit([record])
    render(<FieldCoverageMatrix audit={audit} lang="en" t={THEME_LIGHT} />)

    expect(screen.getByTestId("field-coverage-matrix")).toBeInTheDocument()
    expect(screen.getByText("Field Coverage Matrix")).toBeInTheDocument()
    expect(screen.getByText("surfaceArea")).toBeInTheDocument()
    expect(screen.getByText("poreVolume")).toBeInTheDocument()
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
    expect(screen.getByText("Missing")).toBeInTheDocument()
    expect(screen.getByText("Normalized")).toBeInTheDocument()
  })
})
