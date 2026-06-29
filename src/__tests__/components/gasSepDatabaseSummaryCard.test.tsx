// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import gasData from "../../../public/data/gas_adsorption_records_v1.json"
import { GasSepDatabaseSummaryCard } from "../../components/data/GasSepDatabaseSummaryCard"
import { buildGasSepSummary, buildGasSepExportRows } from "../../utils/summary/buildGasSepSummary"
import { ExportButton } from "../../components/data/ExportButton"

const records = Array.isArray(gasData) ? gasData : gasData.records
const body = () => document.body.textContent || ""
const FORBIDDEN = ["undefined", "null", "NaN", "[object Object]"]

describe("GasSepDatabaseSummaryCard", () => {
  it("renders GasSep metrics from a built summary, with an export button, no forbidden tokens", () => {
    const summary = buildGasSepSummary({ records })
    render(<GasSepDatabaseSummaryCard summary={summary} exportRows={buildGasSepExportRows(records)} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("gassep-database-summary")).toBeInTheDocument()
    expect(screen.getByTestId("gassep-export-button")).toBeInTheDocument()
    expect(body()).toMatch(/App v1\.0\.2/)
    expect(body()).toMatch(/Adsorption Records/)
    expect(body()).toMatch(/Source distribution/)
    for (const bad of FORBIDDEN) expect(body()).not.toContain(bad)
  })

  it("ExportButton builds content lazily and is a no-op-safe in jsdom", () => {
    let built = 0
    render(<ExportButton label="Export CSV" t={THEME_LIGHT} fileName="x.csv" build={() => { built += 1; return "a,b\n1,2\n" }} />)
    screen.getByTestId("export-button").click()
    expect(built).toBe(1)
  })

  it("renders nothing without a summary", () => {
    const { container } = render(<GasSepDatabaseSummaryCard summary={null} lang="en" t={THEME_LIGHT} />)
    expect(container).toBeEmptyDOMElement()
  })
})
