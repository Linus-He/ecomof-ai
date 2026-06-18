// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("benchmarkReadiness", () => {
  it("classifies Label Count = 0 as Not Ready", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("benchmark-readiness-panel")
    expect(panel).toHaveTextContent(/Label Count = 0 -> Not Ready/)
    expect(panel).toHaveTextContent(/Experimental Labels Missing/)
    expect(panel).toHaveTextContent(/Experimental Validation/)
  })
})

