import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import { HomeTab } from "../../components/tabs/HomeTab"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { THEME_LIGHT } from "../../constants/theme"
import { COPY } from "../../i18n"

function response(data) {
  return {
    ok: true,
    json: async () => data,
  }
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

describe("HomeTab navigation CTA", () => {
  it("points homepage CTAs at the requested research hashes", () => {
    const setActiveTab = renderHome()
    const ctas = screen.getByTestId("home-navigation-ctas")

    const expected = [
      ["进入 EcoScreen", "#ecoscreen", "ecoscreen"],
      ["查看算法验证中心", "#methodology-algorithm-validation", "about"],
      ["查看研究报告", "#research-reports", "researchReports"],
      ["查看项目演化", "#project-evolution", "projectEvolution"],
      ["查看 MOF 数据库", "#mof-library", "mofLibrary"],
    ]

    for (const [label, hash, target] of expected) {
      const button = within(ctas).getByRole("button", { name: label })
      expect(button).toHaveAttribute("data-hash", hash)
      fireEvent.click(button)
      expect(setActiveTab).toHaveBeenLastCalledWith(target)
      expect(window.location.hash).toBe(hash)
    }
  })
})
