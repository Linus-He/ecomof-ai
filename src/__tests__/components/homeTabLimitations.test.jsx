import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
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

describe("HomeTab limitations", () => {
  it("shows explicit current limitations without hiding them in tooltips", () => {
    renderHome()
    const limitations = screen.getByTestId("home-current-limitations")

    expect(within(limitations).getByText("Experimental Labels = 0")).toBeInTheDocument()
    expect(within(limitations).getByText("Accuracy / ROC-AUC Pending")).toBeInTheDocument()
    expect(within(limitations).getByText("Final Recommendation Disabled")).toBeInTheDocument()
    expect(within(limitations).getByText("Results require experimental validation")).toBeInTheDocument()
    expect(within(limitations).getByText("CoRE / QMOF values require exact record-level confirmation where marked pending")).toBeInTheDocument()
    expect(within(limitations).queryByText("?")).not.toBeInTheDocument()
  })
})
