import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
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
  it("highlights platform capabilities, data foundation, validation, and research scenarios", () => {
    renderHome()

    const capabilities = screen.getByTestId("home-platform-capabilities")
    expect(within(capabilities).getByText("Current Version")).toBeInTheDocument()
    expect(within(capabilities).getByText("V3.8")).toBeInTheDocument()
    expect(within(capabilities).getByText("Database Scale")).toBeInTheDocument()
    expect(within(capabilities).getByText("3020+ Records")).toBeInTheDocument()
    expect(within(capabilities).getByText("2480 Verified Metadata")).toBeInTheDocument()
    expect(within(capabilities).getByText("Experimental Labels")).toBeInTheDocument()
    expect(within(capabilities).getByText("150")).toBeInTheDocument()
    expect(within(capabilities).getByText("80 External Test")).toBeInTheDocument()
    expect(within(capabilities).getByText("Benchmark Ready")).toBeInTheDocument()
    expect(within(capabilities).getByText("230")).toBeInTheDocument()
    expect(within(capabilities).getByText("Random Forest")).toBeInTheDocument()
    expect(within(capabilities).getByText("Credibility")).toBeInTheDocument()
    expect(within(capabilities).getByText("78.87 / Grade B")).toBeInTheDocument()
    expect(within(capabilities).getByText("Current Risk")).toBeInTheDocument()
    expect(within(capabilities).getByText("High Overfitting Risk")).toBeInTheDocument()

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
    expect(within(validation).getByText("White-box Screening")).toBeInTheDocument()
    expect(within(validation).getByText("Evidence Adjustment")).toBeInTheDocument()
    expect(within(validation).getByText("Sensitivity Analysis")).toBeInTheDocument()
    expect(within(validation).getByText("Experimental Labels")).toBeInTheDocument()
    expect(within(validation).getByText("Benchmark Framework")).toBeInTheDocument()
    expect(within(validation).getAllByText("Benchmark Available").length).toBeGreaterThan(0)
    expect(validation.textContent || "").not.toMatch(/Accuracy\s*=\s*0\.667|ROC\s*=\s*0\.706/i)

    const scenarios = screen.getByTestId("home-research-scenarios")
    expect(within(scenarios).getByText("MOF Discovery")).toBeInTheDocument()
    expect(within(scenarios).getByText("Organic Acid Screening")).toBeInTheDocument()
    expect(within(scenarios).getByText("Benchmark Validation")).toBeInTheDocument()
  })
})
