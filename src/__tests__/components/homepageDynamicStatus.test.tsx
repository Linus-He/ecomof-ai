// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import benchmarkDataset from "../../../public/data/benchmark_dataset_v3_6.json"
import experimentalLabels from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import labelGrowth from "../../../public/data/data_ingestion/experimental_label_growth_v3_6.json"
import modelRobustness from "../../../public/data/model_robustness_report_v1.json"
import { HomeTab } from "../../components/tabs/HomeTab"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"

function response(data) {
  return { ok: true, json: async () => data }
}

function renderHome() {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isMobile: false, isNarrow: false }}>
          <HomeTab setActiveTab={vi.fn()} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async url => {
    const text = String(url)
    if (text.includes("home_summary.json")) return response(homeSummary)
    if (text.includes("version_evolution_records.json")) return response(versionEvolution)
    if (text.includes("data_ingestion_summary_v3.json")) return response(dataIngestionSummary)
    if (text.includes("benchmark_dataset_v3_6.json")) return response(benchmarkDataset)
    if (text.includes("experimental_labels_v2.json")) return response(experimentalLabels)
    if (text.includes("experimental_label_growth_v3_6.json")) return response(labelGrowth)
    if (text.includes("model_robustness_report_v1.json")) return response(modelRobustness)
    return { ok: false, json: async () => null }
  }))
  window.matchMedia = window.matchMedia || vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("homepage dynamic status", () => {
  it("renders Current Capability and Current Limitations from dynamic data (no parallel V3.x progress block)", async () => {
    renderHome()

    await waitFor(() => expect(screen.getByTestId("home-platform-capabilities")).toBeInTheDocument())

    // The legacy "Recent Progress V3.4-V3.6" block was folded into the Web v1.0.0
    // Unified Release Center (pre-1.0 history); the homepage no longer shows it.
    expect(screen.queryByTestId("home-validation-progress")).not.toBeInTheDocument()

    const capabilities = screen.getByTestId("home-platform-capabilities")
    expect(within(capabilities).getByText("当前 Web 版本")).toBeInTheDocument()
    expect(within(capabilities).getByText("Web v1.0.5")).toBeInTheDocument()
    expect(capabilities.textContent).toMatch(/数据状态 V3\.10\.1/)
    expect(within(capabilities).getByText("3462+ 条记录")).toBeInTheDocument()
    expect(within(capabilities).getByText("实验标签")).toBeInTheDocument()
    expect(within(capabilities).getByText("150")).toBeInTheDocument()
    expect(within(capabilities).getByText("230")).toBeInTheDocument()
    expect(within(capabilities).getByText("Random Forest")).toBeInTheDocument()
    expect(within(capabilities).getByText("78.87 / Grade B")).toBeInTheDocument()

    const limitations = screen.getByTestId("home-current-limitations")
    expect(within(limitations).getByText("高过拟合风险")).toBeInTheDocument()
    expect(within(limitations).getByText("实验标签仍需扩充")).toBeInTheDocument()
    expect(within(limitations).getByText("非最终推荐")).toBeInTheDocument()
  })
})
