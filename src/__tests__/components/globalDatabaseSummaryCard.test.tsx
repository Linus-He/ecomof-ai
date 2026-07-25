// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { GlobalDatabaseSummaryCard } from "../../components/data/GlobalDatabaseSummaryCard"
import { DataMetricCard } from "../../components/data/DataMetricCard"
import { buildGlobalDatabaseSummary } from "../../utils/summary/buildGlobalDatabaseSummary"

const body = () => document.body.textContent || ""
const FORBIDDEN = ["undefined", "null", "NaN", "[object Object]"]

describe("GlobalDatabaseSummaryCard", () => {
  it("renders database metrics from a built summary and never shows forbidden tokens", () => {
    const summary = buildGlobalDatabaseSummary({ loaded: { "experimental-labels": { labels: new Array(150) }, "external-test": { records: new Array(80) } } })
    render(<GlobalDatabaseSummaryCard summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("global-database-summary")).toBeInTheDocument()
    expect(body()).toMatch(/Global Database Summary/)
    expect(body()).toMatch(/Web v1\.0\.4/)
    expect(body()).toMatch(/Total Records/)
    for (const bad of FORBIDDEN) expect(body()).not.toContain(bad)
  })

  it("shows a missing-data notice when sources fall back", () => {
    const summary = buildGlobalDatabaseSummary({ loaded: {} })
    render(<GlobalDatabaseSummaryCard summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("missing-data-notice")).toBeInTheDocument()
  })

  it("DataMetricCard never renders undefined/null/NaN/[object Object]", () => {
    for (const v of [undefined, null, NaN, {}, []]) {
      const { container } = render(<DataMetricCard label="X" value={v} type="count" t={THEME_LIGHT} />)
      for (const bad of FORBIDDEN) expect(container.textContent).not.toContain(bad)
    }
  })

  it("renders nothing without a summary", () => {
    const { container } = render(<GlobalDatabaseSummaryCard summary={null} lang="en" t={THEME_LIGHT} />)
    expect(container).toBeEmptyDOMElement()
  })
})
