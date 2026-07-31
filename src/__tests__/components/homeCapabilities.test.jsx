import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, within, waitFor } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import { HomeTab } from "../../components/tabs/HomeTab"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { THEME_LIGHT } from "../../constants/theme"
import { COPY } from "../../i18n"

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
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (String(url).includes("home_summary.json")) return response(homeSummary)
    if (String(url).includes("data_ingestion_summary_v3.json")) return response(dataIngestionSummary)
    if (String(url).includes("version_evolution_records.json")) return response(versionEvolution)
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

describe("home capabilities", () => {
  it("keeps data foundation, validation, and research scenarios after removing the status-card module", async () => {
    renderHome()

    expect(screen.queryByTestId("home-platform-capabilities")).not.toBeInTheDocument()

    const data = screen.getByTestId("home-data-foundation")
    await waitFor(() => expect(within(data).getAllByText("CoRE MOF 2024 CR").length).toBeGreaterThan(0))
    expect(within(data).getAllByText("CoRE MOF 2024 CR").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("FAIR-MOFs").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("气体吸附记录").length).toBeGreaterThan(0)
    expect(data.textContent).not.toMatch(/QMOF|Gold Dataset|Reaction Dataset/)
    expect(within(data).getByText("数据层规模")).toBeInTheDocument()
    expect(within(data).getByText("字段覆盖")).toBeInTheDocument()
    expect(within(data).getByText("来源构成")).toBeInTheDocument()

    const validation = screen.getByTestId("home-algorithm-validation")
    expect(within(validation).getAllByText("可解释筛选").length).toBeGreaterThan(0)
    expect(within(validation).getAllByText("证据修正").length).toBeGreaterThan(0)
    expect(within(validation).getAllByText("敏感性分析").length).toBeGreaterThan(0)
    expect(within(validation).getAllByText("实验标签").length).toBeGreaterThan(0)
    expect(within(validation).getAllByText("Benchmark 框架").length).toBeGreaterThan(0)
    expect(within(validation).getAllByText("Benchmark 已接入").length).toBeGreaterThan(0)
    expect(validation.textContent || "").not.toMatch(/Accuracy\s*=\s*0\.667|ROC\s*=\s*0\.706/i)

    const scenarios = screen.getByTestId("home-research-scenarios")
    expect(within(scenarios).getByRole("tab", { name: /EcoScreen/ })).toBeInTheDocument()
    expect(within(scenarios).getByRole("tab", { name: /GasSep/ })).toBeInTheDocument()
    expect(within(scenarios).getByRole("tab", { name: /Organic Acid/ })).toBeInTheDocument()
    expect(within(scenarios).getByRole("tab", { name: /MOF库/ })).toBeInTheDocument()
    expect(within(scenarios).getByRole("tab", { name: /验证中心/ })).toBeInTheDocument()
  })
})
