// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { EcoScreenTab } from "../../components/tabs/EcoScreenTab"

vi.mock("../../services/dataService", async importOriginal => {
  const actual = await importOriginal()
  const reaction = (await import("../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json")).default
  const benchmark = (await import("../../../public/data/benchmark_dataset_v2.json")).default
  const previewSummary = (await import("../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json")).default
  const sourceRows = (await import("../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json")).default
  const candidates = [
    ...sourceRows.slice(0, 3),
    {
      candidateId: "UNMATCHED-MOF",
      id: "UNMATCHED-MOF",
      displayName: "Unmatched MOF",
      name: "Unmatched MOF",
      surfaceArea: 900,
      poreVolume: 0.4,
      poreSizeA: 6,
      density: 1.1,
      voidFraction: 0.4,
      metalNode: "Zn",
      sourceConfirmed: true,
      citationReady: true,
      fieldSources: {},
    },
  ]
  return {
    ...actual,
    fetchJson: vi.fn(async path => {
      if (String(path).includes("scalable_database_preview_summary")) return previewSummary
      return null
    }),
    fetchDataJson: vi.fn(async fileName => {
      if (fileName === "data_ingestion/organic_acid_reaction_dataset_v1.json") return reaction
      if (fileName === "benchmark_dataset_v2.json") return benchmark
      return null
    }),
    getGlobalMofCandidates: vi.fn(async () => candidates),
  }
})

function renderEcoScreen() {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "en", copy: COPY.en, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
          <EcoScreenTab />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

describe("EcoScreen V3.1 reaction filters", () => {
  it("renders reaction filter controls and filters to reaction-backed candidates", async () => {
    renderEcoScreen()
    await waitFor(() => expect(screen.getByTestId("ecoscreen-reaction-filter")).toBeInTheDocument())
    expect(screen.getByTestId("reaction-filter-hasYield")).toBeInTheDocument()
    expect(screen.getByTestId("reaction-filter-hasSelectivity")).toBeInTheDocument()
    expect(screen.getByTestId("reaction-filter-hasConversion")).toBeInTheDocument()
    expect(screen.getByTestId("reaction-filter-hasDoi")).toBeInTheDocument()
    expect(screen.getByTestId("reaction-filter-goldOnly")).toBeInTheDocument()
    expect(screen.getByTestId("reaction-filter-benchmarkEligibleOnly")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("reaction-filter-goldOnly"))
    await waitFor(() => expect(screen.getByText(/Candidates in view 3 \/ 4/)).toBeInTheDocument())
    fireEvent.click(screen.getByTestId("reaction-filter-benchmarkEligibleOnly"))
    expect(screen.getByText(/Candidates in view 3 \/ 4/)).toBeInTheDocument()
  })
})
