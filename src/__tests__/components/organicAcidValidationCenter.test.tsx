// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidResearchValidationCenter } from "../../components/catalysis/researchValidation/OrganicAcidResearchValidationCenter"

const result = {
  rankedFrameworks: [
    { id: "OA-1", displayName: "OA Candidate 1", rank: 1, hydrothermalGate: { status: "pass" }, organicAcidScore: { oacs: 0.88 } },
    { id: "OA-2", displayName: "OA Candidate 2", rank: 2, hydrothermalGate: { status: "needs_review" }, organicAcidScore: { oacs: 0.59 } },
  ],
}

const evidenceRecords = [
  { id: "E-1", claim: "Measured activity supports candidate 1.", evidenceType: "literature", sourceDoi: "10.1000/test-1", targetDescriptor: "activity" },
  { id: "E-2", claim: "Independent validation remains pending.", evidenceType: "experimental", sourceDoi: "10.1000/test-2", targetDescriptor: "stability" },
]

const experimentalLabels = {
  labels: [
    { labelId: "L-1", candidateId: "OA-1", experimentId: "EXP-1", sourceType: "independent_validation", sourceDoi: "10.1000/test-1", sourceCitation: "Paper A" },
    { labelId: "L-2", candidateId: "OA-2", experimentId: "EXP-2", sourceType: "expert_review", sourceDoi: "10.1000/test-2", sourceCitation: "Paper B" },
  ],
}

const benchmarkDataset = {
  records: [
    { recordId: "B-1", candidateId: "OA-1", datasetOrigin: "experimental", taskType: "binary" },
    { recordId: "B-2", candidateId: "OA-2", datasetOrigin: "derived", taskType: "binary" },
  ],
}

describe("OrganicAcidResearchValidationCenter", () => {
  it("renders the final research validation entry with audit, coverage, matrix, queue, and graph modules", async () => {
    render(<OrganicAcidResearchValidationCenter result={result} evidenceRecords={evidenceRecords} experimentalLabels={experimentalLabels} benchmarkDataset={benchmarkDataset} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("organic-acid-research-validation-center")).toBeInTheDocument()
    expect(screen.getByTestId("label-diversity-audit")).toBeInTheDocument()
    expect(screen.getByTestId("evidence-coverage-dashboard")).toBeInTheDocument()
    expect(screen.getByTestId("pathway-confidence-matrix")).toBeInTheDocument()
    expect(screen.getByTestId("validation-priority-queue")).toBeInTheDocument()
    expect(screen.getByTestId("validation-knowledge-graph")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/Priority Score|Evidence Tier/)
    fireEvent.click(screen.getAllByRole("button", { name: /field-level provenance/i })[0])
    await waitFor(() => expect(screen.getByTestId("field-provenance-popover")).toBeInTheDocument())
    expect(screen.getByTestId("field-provenance-popover").textContent).toMatch(/Field|Source database|Source record id|DOI/)
    expect(document.body.textContent || "").not.toMatch(/placeholder|click here|why this result/i)
  })
})
