// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab, bodyText } from "./modelBenchmarkLabTestUtils"

describe("futureROCAUCPanel", () => {
  it("keeps future ROC-AUC pending and explains external validation is required", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("future-rocauc-panel")
    expect(panel).toHaveTextContent(/ROC-AUC: Pending/)
    expect(panel).toHaveTextContent(/Figure 3g-style/)
    expect(panel).toHaveTextContent(/External validation/)
    expect(bodyText()).not.toMatch(/ROC-AUC:\s*(0\.\d+|[1-9]\d?%)/i)
  })
})

