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
    expect(screen.getByText("怎样筛选更可持续的 MOF？")).toBeInTheDocument()
    expect(screen.getByText("哪种材料更适合气体分离？")).toBeInTheDocument()
    expect(screen.getByText("如何解释催化路径？")).toBeInTheDocument()
    expect(screen.getByText("结构与证据从哪里来？")).toBeInTheDocument()
    expect(screen.getByText("结果是否足够可信？")).toBeInTheDocument()
    expect(screen.getAllByText("数据合规承诺").length).toBeGreaterThan(0)
    expect(screen.queryByTestId("home-platform-capabilities")).not.toBeInTheDocument()
    // The interactive atlas is the primary navigation surface; the detailed research gateway remains below it.
    const atlas = screen.getByTestId("home-scientific-atlas")
    expect(atlas).toBeInTheDocument()
    expect(atlas.querySelector(".home-map-stage")).toBeTruthy()
    expect(atlas.querySelectorAll("[data-cluster-id]")).toHaveLength(5)
    expect(atlas.querySelectorAll("[data-node-id]")).toHaveLength(17)
    expect(atlas.querySelectorAll(".home-map-controls button")).toHaveLength(3)
    expect(screen.getByTestId("home-module-capabilities")).toBeInTheDocument()
    expect(screen.getByTestId("home-descriptor-3d")).toBeInTheDocument()
  })
})
