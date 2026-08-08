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

function renderHome(setActiveTab = vi.fn(), onContactOpen = vi.fn()) {
  render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isMobile: false, isNarrow: false }}>
          <HomeTab setActiveTab={setActiveTab} onContactOpen={onContactOpen} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
  return { setActiveTab, onContactOpen }
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
    const { setActiveTab, onContactOpen } = renderHome()
    const buttons = screen.getByTestId("home-quick-start-buttons")

    const expected = [
      ["生态筛选", "#ecoscreen", "ecoscreen"],
      ["气体分离", "#gassep", "gassep"],
      ["催化", "#catalysis", "catalysisLab"],
      ["MOF库", "#library", "mofLibrary"],
      ["数据合规承诺", "#database-compliance", "dataCompliance"],
    ]

    for (const [label, hash, target] of expected) {
      const button = within(buttons).getByRole("button", { name: label })
      expect(button).toHaveAttribute("data-hash", hash)
      fireEvent.click(button)
      expect(setActiveTab).toHaveBeenLastCalledWith(target)
      expect(window.location.hash).toBe(hash)
    }

    const contact = within(buttons).getByRole("button", { name: "联系我们" })
    expect(contact).toHaveAttribute("data-hash", "#contact")
    fireEvent.click(contact)
    expect(onContactOpen).toHaveBeenCalledWith(true)
    expect(setActiveTab).toHaveBeenCalledTimes(expected.length)
  })

  it("uses the research map as the primary entry surface and preserves routed navigation", () => {
    const { setActiveTab } = renderHome()
    const atlas = screen.getByTestId("home-scientific-atlas")
    const clusterIds = Array.from(atlas.querySelectorAll("[data-cluster-id]")).map(button => button.getAttribute("data-cluster-id"))

    expect(clusterIds).toEqual(["ecoscreen", "library", "gassep", "organic", "validation"])

    fireEvent.click(within(atlas).getByRole("button", { name: /哪种材料更适合气体分离/ }))
    const dialog = atlas.querySelector('[role="dialog"]')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAccessibleName("哪种材料更适合气体分离？")
    fireEvent.click(within(dialog).getByRole("button", { name: "进入完整工作区" }))

    expect(setActiveTab).toHaveBeenLastCalledWith("gassep")
    expect(window.location.hash).toBe("#gassep")
  })
})
