// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen, within } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("futureMetricPendingInteraction", () => {
  it("shows pending reasons when LR, DT, and RF are clicked", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("future-accuracy-panel")
    for (const model of [/LR/i, /DT/i, /RF/i]) {
      fireEvent.click(within(panel).getByRole("button", { name: model }))
      expect(screen.getByTestId("future-accuracy-panel-detail")).toHaveTextContent(/Labels required/)
      expect(screen.getByTestId("future-accuracy-panel-detail")).toHaveTextContent(/Experimental labels/)
      expect(screen.getByTestId("future-accuracy-panel-detail")).toHaveTextContent(/LOO-CV \/ external test/)
    }
  })
})
