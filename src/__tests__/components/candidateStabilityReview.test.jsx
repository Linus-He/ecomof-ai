// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("candidateStabilityReview", () => {
  it("shows candidate rank stability across benchmark modes", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("top-candidate-review")
    expect(panel).toHaveTextContent(/Rank Stability/)
    expect(panel).toHaveTextContent(/balanced/)
    expect(panel).toHaveTextContent(/evidence_first/)
    expect(panel).toHaveTextContent(/validation_first/)
    expect(panel).toHaveTextContent(/low_risk_first/)
  })
})

