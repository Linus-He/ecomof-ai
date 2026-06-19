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

describe("HomeTab current metrics", () => {
  it("shows the V3.3 homepage data status and Chinese-first title", () => {
    renderHome("zh")

    expect(screen.getByRole("heading", { name: "EcoMOF-AI" })).toBeInTheDocument()
    expect(screen.getByText("数据驱动的 MOF 筛选与验证平台")).toBeInTheDocument()
    expect(screen.getByText("Data-driven MOF screening and validation platform")).toBeInTheDocument()

    expect(within(screen.getByTestId("home-metric-total-records")).getByText("3020")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-verified-metadata")).getByText("2480")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-gold-dataset")).getByText("320")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-reaction-dataset")).getByText("520")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-organic-acid-literature")).getByText("540")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-experimental-labels")).getByText("0 / Pending")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-accuracy-roc")).getByText("Pending")).toBeInTheDocument()
    expect(within(screen.getByTestId("home-metric-current-status")).getByText("Database Preview · Not Final Recommendation")).toBeInTheDocument()
  })

  it("does not show stale homepage status counts", () => {
    renderHome("zh")
    const body = document.body.textContent || ""

    expect(body).not.toMatch(/50 seed records/i)
    expect(body).not.toMatch(/250 preview/i)
    expect(body).not.toMatch(/1000 preview/i)
    expect(body).not.toMatch(/verifiedMetadata\s*=\s*30/i)
    expect(body).not.toMatch(/old Model Validation Lab/i)
    expect(body).not.toMatch(/old Model Benchmark Lab/i)
  })
})
