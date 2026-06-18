// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen, within } from "@testing-library/react"
import { renderFigure } from "./algorithmValidationTestUtils"

describe("Figure Inspector", () => {
  it("opens with the database node and exposes input, output, algorithm, weights, field source, data quality, and next step", () => {
    renderFigure()

    const inspector = screen.getByTestId("figure-inspector")
    expect(inspector).toHaveAttribute("data-node", "database")
    for (const label of ["Input", "Output", "Algorithm", "Weights", "Field source", "Data quality", "Next step"]) {
      expect(within(inspector).getByText(label)).toBeInTheDocument()
    }
  })

  it("exposes field-level provenance from the inspector", async () => {
    renderFigure()

    const inspector = screen.getByTestId("figure-inspector")
    const provenanceButton = within(inspector).getByRole("button", { name: /View field provenance/i })
    fireEvent.click(provenanceButton)

    const dialog = await screen.findByRole("dialog", { name: /Field-level provenance/i })
    expect(dialog).toHaveTextContent(/Source database/i)
  })

  it("updates the inspector when a different node is selected and shows ML as Pending", () => {
    renderFigure()

    fireEvent.click(screen.getByTestId("figure-node-future_ml"))

    const inspector = screen.getByTestId("figure-inspector")
    expect(inspector).toHaveAttribute("data-node", "future_ml")
    expect(inspector).toHaveTextContent(/Pending/)
    expect(inspector.textContent).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
  })

  it("shows a blocker line for the experimental validation node", () => {
    renderFigure()

    fireEvent.click(screen.getByTestId("figure-node-experimental"))
    const inspector = screen.getByTestId("figure-inspector")
    expect(inspector).toHaveAttribute("data-node", "experimental")
    expect(inspector).toHaveTextContent(/blocker/i)
  })
})
