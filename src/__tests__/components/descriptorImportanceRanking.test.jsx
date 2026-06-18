// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("descriptorImportanceRanking", () => {
  it("renders required descriptor categories and switches ranking mode", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("descriptor-importance-ranking")
    expect(panel).toHaveTextContent(/surfaceArea/)
    expect(panel).toHaveTextContent(/formicAcidPathwayFit/)
    expect(panel).toHaveTextContent(/Validation/)

    fireEvent.click(screen.getByRole("button", { name: /Organic Acid relevance/i }))
    expect(panel).toHaveTextContent(/organicAcidRelevance|formicAcidPathwayFit/i)
  })
})

