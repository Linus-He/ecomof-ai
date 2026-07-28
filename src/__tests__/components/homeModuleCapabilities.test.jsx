import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import versionEvolution from "../../../public/data/version_evolution_records.json"
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
    if (String(url).includes("version_evolution_records.json")) return response(versionEvolution)
    return { ok: false, json: async () => null }
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe("home module capabilities", () => {
  it("presents each module by capability with its own entry button", () => {
    renderHome("en")
    const modules = screen.getByTestId("home-module-capabilities")
    for (const name of ["EcoScreen", "MOF Library", "Organic Acid", "GasSep"]) {
      expect(within(modules).getAllByText(name).length).toBeGreaterThan(0)
    }
    fireEvent.click(within(modules).getByRole("tab", { name: /GasSep/ }))
    expect(within(modules).getByText("Enter GasSep")).toBeInTheDocument()
    // user-facing, not agent-prompt tone
    expect(modules.textContent).toMatch(/What it does/)
    expect(modules.textContent).not.toMatch(/你的任务|prompt|agent/i)
  })

  it("offers a GasSep quick-start entry peer to the other modules", () => {
    renderHome("zh")
    const quickStart = screen.getByTestId("home-quick-start-buttons")
    expect(within(quickStart).getByText("进入 GasSep")).toBeInTheDocument()
    expect(within(quickStart).getByText("进入 EcoScreen")).toBeInTheDocument()
    expect(within(quickStart).getByText("进入数据合规")).toBeInTheDocument()
  })
})
