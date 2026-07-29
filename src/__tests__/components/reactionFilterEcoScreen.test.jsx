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
  const metalCost = (await import("../../../public/data/metal_precursor_cost_table.json")).default
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
      if (fileName === "metal_precursor_cost_table.json") return metalCost
      return null
    }),
    getGlobalMofCandidates: vi.fn(async () => candidates),
  }
})

function renderEcoScreen(lang = "en") {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang, copy: COPY[lang], setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
          <EcoScreenTab />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

describe("EcoScreen V3.1 reaction filters", () => {
  it("does not mount the calculation-heavy legacy workbench until it is requested", async () => {
    renderEcoScreen()
    expect(screen.queryByTestId("ecoscreen-reaction-filter")).not.toBeInTheDocument()
    expect(screen.getByTestId("ecoscreen-legacy-tools")).not.toHaveAttribute("open")

    fireEvent.click(screen.getByText(/Supplement: legacy descriptor scoring/))
    await waitFor(() => expect(screen.getByTestId("ecoscreen-reaction-filter")).toBeInTheDocument())
    expect(screen.getByTestId("ecoscreen-legacy-tools")).toHaveAttribute("open")
  })

  it("renders reaction filter controls and filters to reaction-backed candidates", async () => {
    renderEcoScreen()
    fireEvent.click(screen.getByText(/Supplement: legacy descriptor scoring/))
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

  it("shows the literature-bounded EcoScreen workbench in natural Chinese", async () => {
    renderEcoScreen("zh")
    fireEvent.click(screen.getByText(/补充工具：旧版描述符评分/))
    await waitFor(() => expect(screen.getByTestId("ecoscreen-literature-workbench")).toBeInTheDocument())
    const text = document.body.textContent || ""
    expect(text).toMatch(/研究任务与证据覆盖/)
    expect(text).toMatch(/气体分离早筛/)
    expect(text).toMatch(/金属成本表/)
    expect(text).toMatch(/仅作覆盖审查/)
    expect(text).toMatch(/不直接扣分/)
    expect(text).toMatch(/通用 MOF 评分/)
    expect(text).toMatch(/产甲酸 CRITIC 案例/)
    expect(text).toMatch(/有收率字段/)
    expect(text).not.toMatch(/General MOF Scoring|Formate CRITIC Case|Has Yield|correlation 相关性/)
  })
})
