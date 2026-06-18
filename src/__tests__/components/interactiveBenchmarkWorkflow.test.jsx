// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen, within } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("interactiveBenchmarkWorkflow", () => {
  it("updates the detail panel when a workflow node is clicked", () => {
    renderBenchmarkLab()

    const workflow = screen.getByTestId("interactive-benchmark-workflow")
    fireEvent.click(within(workflow).getByRole("button", { name: /Bayesian Regression/i }))
    const detail = screen.getByTestId("benchmark-workflow-detail")

    expect(within(detail).getByText(/Bayesian Regression/i)).toBeInTheDocument()
    expect(detail).toHaveTextContent(/Input features/)
    expect(detail).toHaveTextContent(/Output features/)
    expect(detail).toHaveTextContent(/Experimental formic-acid yield/)
    expect(window.localStorage.getItem("ecomof.v27.selectedFeature")).toBe("bayesian_regression")
  })
})
