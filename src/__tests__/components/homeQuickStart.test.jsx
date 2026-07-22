import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import { HomeTab } from "../../components/tabs/HomeTab"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { THEME_LIGHT } from "../../constants/theme"
import { COPY } from "../../i18n"

function response(data) {
  return { ok: true, json: async () => data }
}

function renderHome(setActiveTab = vi.fn()) {
  render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isMobile: false, isNarrow: false }}>
          <HomeTab setActiveTab={setActiveTab} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
  return setActiveTab
}

beforeEach(() => {
  window.history.pushState(null, "", "/")
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

describe("home quick start", () => {
  it("offers direct entry points to the expected workspaces", () => {
    const setActiveTab = renderHome()
    const buttons = screen.getByTestId("home-quick-start-buttons")

    const expected = [
      ["进入 EcoScreen", "#ecoscreen", "ecoscreen"],
      ["进入 GasSep", "#gassep", "gassep"],
      ["进入 Organic Acid", "#catalysis-organic-acid", "catalysisLab"],
      ["进入 MOF Library", "#library", "mofLibrary"],
      ["进入验证中心", "#methodology-algorithm-validation", "about"],
    ]

    for (const [label, hash, target] of expected) {
      const button = within(buttons).getByRole("button", { name: label })
      expect(button).toHaveAttribute("data-hash", hash)
      fireEvent.click(button)
      expect(setActiveTab).toHaveBeenLastCalledWith(target)
      expect(window.location.hash).toBe(hash)
    }
  })
})
