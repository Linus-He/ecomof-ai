// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import gasV2 from "../../../public/data/gas_adsorption_records_v2.json"
import gasV1 from "../../../public/data/gas_adsorption_records_v1.json"
import gasDemo from "../../../public/data/gas_adsorption_records_demo.json"
import collectionReport from "../../../public/data/gas_adsorption_v2_collection_report.json"
import iastReport from "../../../public/data/gas_adsorption_v2_1_iast_report.json"
import identityReport from "../../../public/data/mof_identity_resolution_report.json"
import proxyReport from "../../../public/data/gas_structure_proxy_validation_report.json"
import { THEME_DARK, THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { COPY } from "../../i18n"
import { GasSepTab } from "../../components/tabs/GasSepTab"

const DATA_BY_FILE = {
  "gas_adsorption_records_v2.json": gasV2,
  "gas_adsorption_records_v1.json": gasV1,
  "gas_adsorption_records_demo.json": gasDemo,
  "gas_adsorption_v2_collection_report.json": collectionReport,
  "gas_adsorption_v2_1_iast_report.json": iastReport,
  "mof_identity_resolution_report.json": identityReport,
  "gas_structure_proxy_validation_report.json": proxyReport,
}

function response(data) {
  return { ok: true, json: async () => data }
}

function bodyText() {
  return document.body.textContent || ""
}

function renderGasSep({
  lang = "zh",
  theme = THEME_LIGHT,
  viewport = { isNarrow: false, isMobile: false },
} = {}) {
  return render(
    <ThemeCtx.Provider value={theme}>
      <LangCtx.Provider value={{ lang, copy: COPY[lang], setLang: vi.fn() }}>
        <ViewportCtx.Provider value={viewport}>
          <GasSepTab onNavigate={vi.fn()} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

async function waitForGasSep(lang = "zh") {
  await screen.findByText(lang === "zh" ? "排序方法与文献依据" : "Ranking Method and Literature Basis")
  await waitFor(() => expect(screen.getByTestId("gas-performance-map")).toHaveAttribute("data-point-count"))
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async url => {
    const path = String(url)
    const file = Object.keys(DATA_BY_FILE).find(name => path.includes(name))
    if (file) return response(DATA_BY_FILE[file])
    return { ok: false, status: 404, json: async () => null }
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("GasSep adaptation regressions", () => {
  it("renders the method, funnel, and ranking copy in Chinese", async () => {
    renderGasSep({ lang: "zh" })
    await waitForGasSep("zh")
    expect(screen.getByRole("heading", { level: 1, name: "气体分离" })).toBeInTheDocument()
    expect(bodyText()).toMatch(/筛选漏斗/)
    expect(bodyText()).toMatch(/当前方法指标/)
    expect(bodyText()).toMatch(/历史 GasScore/)
    expect(bodyText()).toMatch(/吸附热力学与竞争平衡/)
    expect(document.querySelector('[data-formula-id="henry-affinity"]')?.getAttribute("aria-label"))
      .toContain("K_H,i = lim(P_i→0)")
    expect(document.querySelector('[data-formula-id="iast-constraints"]')?.getAttribute("aria-label"))
      .toContain("π_A(P_A^0) = π_B(P_B^0)")
    expect(screen.getByTestId("gassep-thermodynamic-panel")).toBeInTheDocument()
    expect(Number(screen.getByTestId("gas-performance-map").getAttribute("data-point-count"))).toBeGreaterThan(0)
  }, 10000)

  it("renders the method, funnel, and ranking copy in English", async () => {
    renderGasSep({ lang: "en" })
    await waitForGasSep("en")
    expect(screen.getByRole("heading", { level: 1, name: "GasSep" })).toBeInTheDocument()
    expect(bodyText()).toMatch(/Screening Funnel/)
    expect(bodyText()).toMatch(/Method metric/)
    expect(bodyText()).toMatch(/Legacy GasScore/)
    expect(bodyText()).toMatch(/Adsorption Thermodynamics and Competitive Equilibrium/)
    expect(bodyText()).toMatch(/Scenario IAST/)
    expect(Number(screen.getByTestId("gas-performance-map").getAttribute("data-point-count"))).toBeGreaterThan(0)
  }, 10000)

  it("provides PPT-relevant C2 feed scenarios and validates the ratio input", async () => {
    renderGasSep({ lang: "zh" })
    await waitForGasSep("zh")

    const gasPair = screen.getByLabelText("gas pair")
    fireEvent.change(gasPair, { target: { value: "C2H2/C2H4" } })
    expect(bodyText()).toMatch(/痕量乙炔脱除/)
    expect(screen.getByRole("button", { name: "0.5/99.5" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1/99" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1/999" })).toBeInTheDocument()

    const ratio = screen.getByLabelText("混合比例")
    fireEvent.change(ratio, { target: { value: "bad-ratio" } })
    expect(ratio).toHaveAttribute("aria-invalid", "true")
    expect(bodyText()).toContain("请使用 A/B 格式")
  }, 10000)

  it("updates the thermodynamic plot context and source ids when the selected MOF changes", async () => {
    renderGasSep({ lang: "zh" })
    await waitForGasSep("zh")

    const materialSelect = screen.getByLabelText("选择 MOF 气体分离记录")
    const computedOptions = [...materialSelect.options].filter(option => {
      const record = gasV2.find(row => row.id === option.value)
      return record?.dataGrade === "computed-IAST" && record.secondaryIsotherm?.length >= 3
    })
    expect(computedOptions.length).toBeGreaterThan(1)

    const firstRecord = gasV2.find(row => row.id === computedOptions[0].value)
    const secondRecord = gasV2.find(row => row.id === computedOptions[1].value)
    fireEvent.change(materialSelect, { target: { value: firstRecord.id } })
    const panel = screen.getByTestId("gassep-thermodynamic-panel")
    expect(within(panel).getByText(new RegExp(firstRecord.iast.sourceIsothermIds.primary, "i"))).toBeInTheDocument()
    expect(panel.textContent).toContain(firstRecord.iast.sourceIsothermIds.secondary.toLowerCase())
    const firstContext = panel.textContent

    fireEvent.change(materialSelect, { target: { value: secondRecord.id } })
    await waitFor(() => expect(panel.textContent).toContain(secondRecord.iast.sourceIsothermIds.secondary.toLowerCase()))
    expect(panel.textContent).not.toBe(firstContext)
  }, 10000)

  it("keeps ranking method cards on theme tokens in light and dark mode", async () => {
    const dark = renderGasSep({ lang: "en", theme: THEME_DARK })
    await waitForGasSep("en")
    expect(screen.getByTestId("gas-ranking-method-pareto-aps")).toHaveStyle({ background: THEME_DARK.badgeInfoBg })
    expect(screen.getByTestId("gas-ranking-method-legacy-gasscore")).toHaveStyle({ background: THEME_DARK.surface })

    dark.unmount()
    cleanup()

    renderGasSep({ lang: "en", theme: THEME_LIGHT })
    await waitForGasSep("en")
    expect(screen.getByTestId("gas-ranking-method-pareto-aps")).toHaveStyle({ background: THEME_LIGHT.badgeInfoBg })
    expect(screen.getByTestId("gas-ranking-method-legacy-gasscore")).toHaveStyle({ background: THEME_LIGHT.surface })
  }, 10000)

  it("uses mobile single-column method and funnel layouts while preserving interactivity", async () => {
    renderGasSep({
      lang: "zh",
      theme: THEME_LIGHT,
      viewport: { isNarrow: true, isMobile: true },
    })
    await waitForGasSep("zh")

    expect(screen.getByTestId("gas-ranking-method-pareto-aps").parentElement).toHaveStyle({ gridTemplateColumns: "1fr" })
    expect(screen.getByTestId("gas-screening-gate-all").parentElement).toHaveStyle({ gridTemplateColumns: "1fr" })

    fireEvent.click(screen.getByTestId("gas-screening-gate-aps-eligible"))
    expect(bodyText()).toMatch(/可计算 APS/)

    fireEvent.change(screen.getByLabelText("ranking method"), { target: { value: "critic-objective" } })
    expect(screen.getByTestId("gas-ranking-method-critic-objective")).toHaveStyle({ background: THEME_LIGHT.badgeInfoBg })
    expect(bodyText()).toMatch(/CRITIC/)
  }, 10000)
})
