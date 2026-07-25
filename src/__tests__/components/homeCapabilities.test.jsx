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
  it("highlights platform capabilities, data foundation, validation, and research scenarios", async () => {
    renderHome()

    const capabilities = screen.getByTestId("home-platform-capabilities")
    await waitFor(() => expect(within(capabilities).getByText("Web v1.0.5")).toBeInTheDocument())
    expect(within(capabilities).getByText("当前 Web 版本")).toBeInTheDocument()
    expect(capabilities.textContent).toMatch(/数据状态 V3\.10\.1/)
    expect(within(capabilities).getByText("数据库规模")).toBeInTheDocument()
    expect(within(capabilities).getByText("3462+ 条记录")).toBeInTheDocument()
    expect(within(capabilities).getByText("2480 条已核验元数据")).toBeInTheDocument()
    expect(within(capabilities).getByText("实验标签")).toBeInTheDocument()
    expect(within(capabilities).getByText("150")).toBeInTheDocument()
    expect(within(capabilities).getByText("0 条外部测试")).toBeInTheDocument()
    expect(within(capabilities).getByText("Benchmark 就绪")).toBeInTheDocument()
    expect(within(capabilities).getByText("230")).toBeInTheDocument()
    expect(within(capabilities).getByText("Random Forest")).toBeInTheDocument()
    expect(within(capabilities).getAllByText("模型可信度").length).toBeGreaterThan(0)
    expect(within(capabilities).getByText("78.87 / Grade B")).toBeInTheDocument()
    expect(within(capabilities).getByText("当前风险")).toBeInTheDocument()
    expect(within(capabilities).getByText("高过拟合风险")).toBeInTheDocument()

    const data = screen.getByTestId("home-data-foundation")
    expect(within(data).getAllByText("CoRE MOF").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("QMOF").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("Organic Acid Literature").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("Reaction Dataset").length).toBeGreaterThan(0)
    expect(within(data).getAllByText("Gold Dataset").length).toBeGreaterThan(0)
    expect(within(data).getByText("Data Coverage")).toBeInTheDocument()
    expect(within(data).getByText("Data Quality")).toBeInTheDocument()
    expect(within(data).getByText("Source Distribution")).toBeInTheDocument()

    const validation = screen.getByTestId("home-algorithm-validation")
    expect(within(validation).getAllByText("白盒筛选").length).toBeGreaterThan(0)
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
    expect(within(scenarios).getByRole("tab", { name: /MOF Library/ })).toBeInTheDocument()
    expect(within(scenarios).getByRole("tab", { name: /验证中心/ })).toBeInTheDocument()
  })
})
