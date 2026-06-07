// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { AlgorithmRunLauncher } from "../../components/catalysis/organic-acid-final/run-launcher/AlgorithmRunLauncher"

const databaseIndexOverview = {
  manifest: {
    datasetMode: "database_index_preview",
    sourceDatabases: [{ name: "CoRE MOF", recordCount: 500, detailCount: 30 }],
  },
  coreSummary: { recordCount: 500, readyForScoring: 12, needsReview: 63, rejected: 0 },
  qmofSummary: { recordCount: 200 },
  descriptorAvailability: { descriptorCoverage: [{ descriptor: "hydrothermalStability", available: 12, percent: 2.4 }] },
  provenanceCoverage: { doiCoveragePercent: 0, fieldSourceCoveragePercent: 42 },
  topCandidates: {
    topCandidates: [{ rank: 1, frameworkId: "COREMOF_000001", displayName: "MIL-53(Al) preview", oacsPreview: 0.89, dataQualityStatus: "ready_for_scoring", detailRef: "detail/framework/COREMOF_000001.json" }],
  },
}

afterEach(() => {
  vi.useRealTimers()
})

describe("Run Launcher database index mode", () => {
  it("runs database index preview without full screening claims", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Database index preview/i }))

    expect(screen.getAllByText(/does not run full database scoring in the browser/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Run full CoRE\/QMOF screening/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Run database index preview/i }))
    await act(async () => {
      vi.runAllTimers()
    })

    expect(onTraceReady).toHaveBeenCalled()
    const trace = onTraceReady.mock.calls[0][0]
    expect(trace.dataMode).toBe("database_index_preview")
    expect(trace.boundaries[0].label).toMatch(/Index-level trace boundary/)
    expect(trace.warnings.join(" ")).toMatch(/not full verified database screening/)
  })
})
