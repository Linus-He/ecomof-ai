import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import { HomeTab } from "../../components/tabs/HomeTab"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { THEME_LIGHT } from "../../constants/theme"
import { COPY } from "../../i18n"

function response(data) {
  return { ok: true, json: async () => data }
}

function renderHome(lang = "zh") {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang, copy: COPY[lang], setLang: vi.fn() }}>
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

describe("home information architecture", () => {
  it("renders the product overview sections in the requested order", () => {
    renderHome("zh")

    const sectionIds = [
      "home-hero",
      "home-data-foundation",
      "home-algorithm-validation",
      "home-research-scenarios",
      "home-current-limitations",
      "home-quick-start",
    ]

    const sections = sectionIds.map(id => screen.getByTestId(id))
    expect(sections.map(section => section.getAttribute("data-testid"))).toEqual(sectionIds)

    expect(screen.getByRole("heading", { name: "EcoMOF-AI" })).toBeInTheDocument()
    expect(screen.getByText("数据驱动的 MOF 筛选与验证平台")).toBeInTheDocument()
    expect(screen.getByText("四个研究工作区覆盖可持续性筛选、气体分离、白盒催化路线与材料数据库浏览。")).toBeInTheDocument()
    expect(screen.getAllByText("数据合规承诺").length).toBeGreaterThan(0)
    expect(screen.queryByTestId("home-platform-capabilities")).not.toBeInTheDocument()
    // module-first capability section and the interactive 3D descriptor visual are part of the home IA
    const atlas = screen.getByTestId("home-scientific-atlas")
    expect(atlas).toBeInTheDocument()
    expect(atlas).toHaveTextContent("多目标研究函数")
    expect(atlas.querySelectorAll('[role="tab"]')).toHaveLength(4)
    expect(atlas.querySelector(".home-equation-pipeline")).toBeTruthy()
    expect(atlas.querySelectorAll('[data-testid="katex-block"]').length).toBeGreaterThan(1)
    expect(screen.getByTestId("home-module-capabilities")).toBeInTheDocument()
    expect(screen.getByTestId("home-descriptor-3d")).toBeInTheDocument()
  })
})
