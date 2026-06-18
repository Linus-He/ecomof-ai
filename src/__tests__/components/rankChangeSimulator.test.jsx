// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import { renderBenchmarkLab, bodyText, benchmarkAlgorithm } from "./modelBenchmarkLabTestUtils"
import { BENCHMARK_MODES, topCandidateReviewRows } from "../../utils/modelBenchmarkLab"

describe("rankChangeSimulator", () => {
  it("can change candidate ordering mode without claiming ML metrics", () => {
    renderBenchmarkLab()

    const algorithm = benchmarkAlgorithm()
    const snapshots = BENCHMARK_MODES.map(mode => topCandidateReviewRows(algorithm, mode.id).map(row => row.candidateId).join(">"))
    expect(new Set(snapshots).size).toBeGreaterThan(1)

    const simulator = screen.getByTestId("rank-change-simulator")
    fireEvent.click(screen.getByRole("button", { name: /low risk first/i }))

    expect(simulator).toHaveTextContent(/low risk first/)
    expect(window.localStorage.getItem("ecomof.v27.selectedBenchmarkMode")).toBe("low_risk_first")
    expect(bodyText()).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%)/i)
    expect(bodyText()).not.toMatch(/ROC-AUC:\s*(0\.\d+|[1-9]\d?%)/i)
  })
})

