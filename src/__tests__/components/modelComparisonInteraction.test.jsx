// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import { renderBenchmarkLab, bodyText } from "./modelBenchmarkLabTestUtils"

describe("modelComparisonInteraction", () => {
  it("switches model metrics without showing fake Accuracy values", () => {
    renderBenchmarkLab()

    fireEvent.click(screen.getByRole("button", { name: /Future Accuracy/i }))
    fireEvent.click(screen.getByRole("button", { name: /Random Forest/i }))

    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Future Accuracy: Pending/)
    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Experimental labels required/)
    expect(bodyText()).not.toMatch(/Future Accuracy:\s*(0\.\d+|[1-9]\d?%)/i)
    expect(window.localStorage.getItem("ecomof.v27.selectedMetric")).toBe("Future Accuracy")
  })

  it("switches to Future ROC-AUC without showing fake ROC values", () => {
    renderBenchmarkLab()

    fireEvent.click(screen.getByRole("button", { name: /Future ROC-AUC/i }))

    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Future ROC-AUC: Pending/)
    expect(bodyText()).not.toMatch(/Future ROC-AUC:\s*(0\.\d+|[1-9]\d?%)/i)
  })
})

