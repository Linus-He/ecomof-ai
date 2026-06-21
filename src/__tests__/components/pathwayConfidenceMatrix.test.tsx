// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { PathwayConfidenceMatrix } from "../../components/catalysis/researchValidation/OrganicAcidResearchValidationCenter"
import { buildPathwayConfidenceMatrix } from "../../utils/organicAcidResearchValidation"

const result = {
  rankedFrameworks: [
    { id: "A", displayName: "Candidate A", rank: 1, hydrothermalGate: { status: "pass" }, organicAcidScore: { oacs: 0.86 } },
    { id: "B", displayName: "Candidate B", rank: 2, hydrothermalGate: { status: "needs_review" }, organicAcidScore: { oacs: 0.62 } },
  ],
}

describe("PathwayConfidenceMatrix", () => {
  it("renders evidence strength by data quality and opens the Evidence Inspector", () => {
    const points = buildPathwayConfidenceMatrix({ result })
    const { container } = render(<PathwayConfidenceMatrix points={points} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("pathway-confidence-matrix")).toBeInTheDocument()
    expect(screen.getByText("Evidence Inspector")).toBeInTheDocument()
    expect(screen.getByText("Candidate A")).toBeInTheDocument()
    expect(screen.getAllByText("Evidence Strength").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Data Quality").length).toBeGreaterThan(0)
    expect(screen.getByText("Target product")).toBeInTheDocument()
    expect(screen.getByText("Evidence type")).toBeInTheDocument()
    expect(screen.getByText("Confidence level")).toBeInTheDocument()
    expect(screen.getAllByTestId("confidence-matrix-cell").length).toBeGreaterThan(0)

    const pointGroups = container.querySelectorAll('[data-testid="pathway-confidence-matrix"] svg g')
    fireEvent.click(pointGroups[pointGroups.length - 1])
    expect(screen.getByText("Candidate B")).toBeInTheDocument()
    fireEvent.click(screen.getAllByTestId("confidence-matrix-cell")[0])
    expect(screen.getByTestId("evidence-inspector").textContent).toMatch(/Evidence Type|Confidence Level|Low-confidence reason/)
  })
})
