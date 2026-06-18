// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab, bodyText } from "./modelBenchmarkLabTestUtils"

describe("futureAccuracyPanel", () => {
  it("keeps future Accuracy pending and explains labels are required", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("future-accuracy-panel")
    expect(panel).toHaveTextContent(/Accuracy: Pending/)
    expect(panel).toHaveTextContent(/Figure 3f-style/)
    expect(panel).toHaveTextContent(/Experimental labels/)
    expect(bodyText()).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%)/i)
  })
})

