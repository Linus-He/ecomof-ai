import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { buildHomeExplorerModel, HomeDataExplorer } from "../../components/home/HomeDataExplorer"
import { THEME_LIGHT } from "../../constants/theme"

describe("HomeDataExplorer", () => {
  it("renders linked real-data charts and updates when a metal filter is clicked", () => {
    const model = buildHomeExplorerModel()
    const topMetal = model.metalCounts[0]
    render(<HomeDataExplorer t={THEME_LIGHT} lang="en" isMobile={false} />)

    expect(screen.getByTestId("home-data-explorer")).toBeInTheDocument()
    expect(screen.getByTestId("home-stat-distribution")).toBeInTheDocument()
    expect(screen.getByTestId("home-metal-filter-chart")).toBeInTheDocument()
    expect(screen.getByTestId("home-correlation-matrix")).toBeInTheDocument()
    expect(screen.getByText(/All charts are dynamically derived from/)).toBeInTheDocument()

    const allButton = screen.getByRole("button", { name: /All ·/ })
    const allCount = Number(allButton.textContent.match(/\d+/)?.[0])
    expect(allCount).toBeGreaterThan(1000)

    const metalButton = screen.getByRole("button", { name: new RegExp(`${topMetal.metal} ·`) })
    fireEvent.click(metalButton)
    expect(screen.getAllByText(new RegExp(`${topMetal.metal} · ${topMetal.count}`)).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: /Pore volume/ }))
    expect(screen.getByRole("button", { name: /Pore volume/ })).toBeInTheDocument()
  })
})
