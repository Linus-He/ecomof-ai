// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { AlgorithmRunLauncher } from "../../components/catalysis/organic-acid-final/run-launcher/AlgorithmRunLauncher"

const databaseIndexOverview = {
  manifest: {
    datasetMode: "real_core_mof_cr_index",
    sourceDatabases: [{ name: "CoRE MOF 2024 · CSD-modified CR", recordCount: 9835, detailCount: 30 }],
  },
  coreSummary: { recordCount: 9835, readyForScoring: 9835, needsReview: 0, rejected: 0 },
  qmofSummary: { recordCount: 0, status: "quarantined" },
  descriptorAvailability: { descriptorCoverage: [{ descriptor: "surfaceArea", available: 9835, percent: 100 }] },
  provenanceCoverage: { doiCoveragePercent: 100, fieldSourceCoveragePercent: 100 },
  topCandidates: {
    topCandidates: [{ rank: 1, frameworkId: "coremof2024-csdm-00001", displayName: "ABAVIJ", descriptorCompletenessPercent: 100, dataQualityStatus: "ready_for_structural_screening", detailRef: "detail/framework/coremof2024-csdm-00001.json" }],
  },
}

afterEach(() => {
  vi.useRealTimers()
})

describe("Run Launcher database index mode", () => {
  it("runs the real CoRE structural-index audit without catalytic-performance claims", async () => {
    vi.useFakeTimers()
    const onTraceReady = vi.fn()
    render(
      <AlgorithmRunLauncher
        frameworks={[]}
        metals={[]}
        rules={{}}
        evidenceRecords={[]}
        result={{}}
        databaseIndexOverview={databaseIndexOverview}
        onTraceReady={onTraceReady}
        lang="en"
        t={THEME_LIGHT}
        isMobile={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /CoRE structural-index audit/i }))

    expect(screen.getAllByText(/does not infer catalytic performance/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Run full CoRE\/QMOF screening/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Run CoRE structural-index audit/i }))
    await act(async () => {
      vi.runAllTimers()
    })

    expect(onTraceReady).toHaveBeenCalled()
    const trace = onTraceReady.mock.calls[0][0]
    expect(trace.dataMode).toBe("database_index_preview")
    expect(trace.boundaries[0].label).toMatch(/Index-level trace boundary/)
    expect(trace.warnings.join(" ")).toMatch(/does not by itself validate catalytic performance/)
  })
})
