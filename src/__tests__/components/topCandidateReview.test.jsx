// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("topCandidateReview", () => {
  it("shows candidate score breakdown, provenance, next experiment, and uncertainty", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("top-candidate-review")
    fireEvent.click(screen.getByRole("button", { name: /Low evidence high pathway scaffold/i }))

    expect(panel).toHaveTextContent(/score breakdown/i)
    expect(panel).toHaveTextContent(/sensitivity result/i)
    expect(panel).toHaveTextContent(/next experiment/i)
    expect(panel).toHaveTextContent(/Why Ranked Here/)
    expect(panel).toHaveTextContent(/What Could Change The Rank/)
    expect(panel).toHaveTextContent(/Biggest Uncertainty/)
  })
})

