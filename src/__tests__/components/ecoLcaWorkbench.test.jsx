// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { EcoLcaWorkbench } from "../../components/ecoscreen/EcoLcaWorkbench"

vi.mock("../../services/dataService", async importOriginal => {
  const actual = await importOriginal()
  const candidates = (await import("../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json")).default.slice(0, 4)
  const inventory = (await import("../../../public/data/lca_inventory.json")).default
  const costs = (await import("../../../public/data/metal_precursor_cost_table.json")).default
  const model = (await import("../../../public/data/ecoscreen_lca_model_v1.json")).default
  const baselines = (await import("../../../public/data/ecoscreen_regional_baselines_v1.json")).default
  const registry = (await import("../../../public/data/ecoscreen_evidence_source_registry_v1.json")).default
  const evidenceSummary = (await import("../../../public/data/ecoscreen_candidate_process_evidence_summary_v1.json")).default
  const evidence = {
    ...evidenceSummary,
    records: [{
      candidateId: "FAIR_MOF_TEST01",
      id: "FAIR_MOF_TEST01",
      displayName: "TEST01",
      name: "TEST01",
      rawName: "TEST01",
      sourceDatabase: "FAIR-MOFs synthesis conditions",
      sourceRecordId: "TEST01",
      doi: "10.1000/test01",
      metalNode: "Cu",
      metalPrecursor: ["copper nitrate"],
      linker: "benzene-1,3,5-tricarboxylic acid",
      synthesisRoute: "solvothermal",
      synthesisSolvent: "DMF",
      synthesisTemperatureC: 120,
      synthesisTimeHours: 24,
      reactionQuantities: { "copper nitrate": [{ quantity: 1, unit: "mmol" }] },
      processEvidence: { availableProcessFields: 8 },
    }],
  }
  return {
    ...actual,
    getGlobalMofCandidates: vi.fn(async () => candidates),
    fetchDataJson: vi.fn(async fileName => {
      if (fileName === "lca_inventory.json") return inventory
      if (fileName === "metal_precursor_cost_table.json") return costs
      if (fileName === "ecoscreen_lca_model_v1.json") return model
      if (fileName === "ecoscreen_candidate_process_evidence_v1.json") return evidence
      if (fileName === "ecoscreen_regional_baselines_v1.json") return baselines
      if (fileName === "ecoscreen_evidence_source_registry_v1.json") return registry
      return null
    }),
  }
})

function renderWorkbench(lang = "zh") {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang, copy: COPY[lang], setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
          <EcoLcaWorkbench />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

describe("EcoScreen LCA-first workbench", () => {
  it("renders the LCA chain, economic model, readiness gate, and source basis", async () => {
    renderWorkbench()
    const workbench = await screen.findByTestId("ecoscreen-lca-workbench")
    expect(within(workbench).getByTestId("ecoscreen-goal-scope")).toHaveTextContent("目标与范围")
    expect(within(workbench).getByTestId("ecoscreen-goal-scope")).toHaveTextContent("中国基准")
    expect(within(workbench).getByTestId("ecoscreen-candidate-evidence")).toHaveTextContent("4,168")
    expect(within(workbench).getByTestId("ecoscreen-candidate-evidence")).toHaveTextContent("0 / 7")
    expect(within(workbench).getByTestId("ecoscreen-lca-results")).toHaveTextContent("GWP 情景值")
    expect(within(workbench).getByTestId("ecoscreen-economic-analysis")).toHaveTextContent("不是完整 TEA")
    expect(within(workbench).getByTestId("ecoscreen-method-readiness")).toHaveTextContent("准备度需达到 75%")
    expect(within(workbench).getByTestId("ecoscreen-method-readiness")).toHaveTextContent("硬阻断")
    expect(within(workbench).getByTestId("ecoscreen-literature-basis")).toHaveTextContent("ISO 14040 / ISO 14044")
  })

  it("switches functional unit and exposes the capture-service assumptions", async () => {
    renderWorkbench()
    const workbench = await screen.findByTestId("ecoscreen-lca-workbench")
    fireEvent.click(within(workbench).getByRole("button", { name: "捕集 1 t CO₂" }))
    await waitFor(() => expect(within(workbench).getByTestId("ecoscreen-service-parameters")).toBeInTheDocument())
    expect(within(workbench).getByTestId("ecoscreen-lca-results")).toHaveTextContent("/t CO₂")
  })

  it("changes route assumptions without relabeling them as measured candidate data", async () => {
    renderWorkbench()
    const workbench = await screen.findByTestId("ecoscreen-lca-workbench")
    const routeButton = within(workbench).getByRole("button", { name: "机械化学/低溶剂情景" })
    fireEvent.click(routeButton)
    expect(routeButton).toHaveAttribute("aria-pressed", "true")
    expect(within(workbench).getByTestId("ecoscreen-scenario-controls")).toHaveTextContent("不能假定所有 MOF 都可采用该路线")
  })

  it("switches between China and international environmental/economic baselines", async () => {
    renderWorkbench()
    const workbench = await screen.findByTestId("ecoscreen-lca-workbench")
    const resultPanel = within(workbench).getByTestId("ecoscreen-lca-results")
    expect(resultPanel).toHaveTextContent("¥")
    fireEvent.click(within(workbench).getByRole("button", { name: "国际参考" }))
    await waitFor(() => expect(within(workbench).getByTestId("ecoscreen-goal-scope")).toHaveTextContent("0.4350 kg CO₂/kWh"))
    expect(resultPanel).toHaveTextContent("$")
  })

  it("switches to a FAIR-MOFs candidate and exposes real process evidence without passing the LCA gate", async () => {
    renderWorkbench()
    const workbench = await screen.findByTestId("ecoscreen-lca-workbench")
    fireEvent.click(within(workbench).getByRole("button", { name: "合成证据库 1" }))
    await waitFor(() => expect(within(workbench).getByTestId("ecoscreen-candidate-evidence")).toHaveTextContent("TEST01"))
    expect(within(workbench).getByTestId("ecoscreen-candidate-evidence")).toHaveTextContent("真实合成条件")
    expect(within(workbench).getByTestId("ecoscreen-method-readiness")).toHaveTextContent("产率")
    expect(within(workbench).getByTestId("ecoscreen-method-readiness")).toHaveTextContent("合成能耗缺失")
  })
})
