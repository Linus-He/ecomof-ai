// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import experimentalLabels from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import benchmarkDataset from "../../../public/data/benchmark_dataset_v3_6.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import { THEME_LIGHT } from "../../constants/theme"
import { EvidenceCoverageDashboard } from "../../components/catalysis/researchValidation/OrganicAcidResearchValidationCenter"
import { buildEvidenceCoverageDashboard } from "../../utils/organicAcidResearchValidation"

describe("EvidenceCoverageDashboard", () => {
  it("renders clickable coverage buckets and filters the linked Evidence Table", () => {
    const coverage = buildEvidenceCoverageDashboard({ evidenceRecords, labels: experimentalLabels, benchmarkDataset })
    render(<EvidenceCoverageDashboard coverage={coverage} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("evidence-coverage-dashboard")).toBeInTheDocument()
    expect(screen.getByTestId("evidence-coverage-profile")).toBeInTheDocument()
    expect(screen.getAllByText("Literature").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Experimental").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Expert Review").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Derived").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: /Experimental/ }))
    const tableText = screen.getByTestId("evidence-table").textContent || ""
    expect(tableText).toMatch(/Experimental/)
    expect(tableText).not.toMatch(/Literature/)
    expect(tableText).not.toMatch(/Expert Review/)
  })
})
