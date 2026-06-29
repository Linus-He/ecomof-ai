import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MofDescriptor3DScatter } from "../../components/home/MofDescriptor3DScatter"
import { THEME_LIGHT } from "../../constants/theme"

describe("MofDescriptor3DScatter", () => {
  it("renders an interactive 3D scatter on real descriptor data (desktop)", () => {
    render(<MofDescriptor3DScatter t={THEME_LIGHT} lang="en" isMobile={false} />)
    const card = screen.getByTestId("home-3d-scatter")
    const svg = card.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg.getAttribute("aria-label")).toMatch(/3D scatter/)
    // real points are plotted as circles
    expect(card.querySelectorAll("circle").length).toBeGreaterThan(5)
    expect(card.textContent).toMatch(/Surface area/)
    expect(card.textContent).toMatch(/Porosity/)
  })

  it("degrades to a 2D scatter on mobile", () => {
    render(<MofDescriptor3DScatter t={THEME_LIGHT} lang="zh" isMobile />)
    const card = screen.getByTestId("home-3d-scatter")
    expect(card.querySelector("svg").getAttribute("aria-label")).toMatch(/2D/)
    expect(card.querySelectorAll("circle").length).toBeGreaterThan(5)
  })
})
