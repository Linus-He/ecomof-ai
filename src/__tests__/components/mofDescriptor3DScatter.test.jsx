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
    expect(card.textContent).toMatch(/porosity/i)
  })

  it("spreads points across the cube rather than clustering in one corner", () => {
    render(<MofDescriptor3DScatter t={THEME_LIGHT} lang="en" isMobile={false} />)
    const card = screen.getByTestId("home-3d-scatter")
    const svg = card.querySelector("svg")
    const vb = svg.getAttribute("viewBox").split(" ").map(Number)
    const [, , W, H] = vb
    const circles = [...card.querySelectorAll("circle")]
    const xs = circles.map(c => Number(c.getAttribute("cx")))
    const ys = circles.map(c => Number(c.getAttribute("cy")))
    // data should occupy a wide band of the plot, not a tiny corner
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(W * 0.4)
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(H * 0.4)
  })

  it("keeps the interactive 3D scatter on mobile", () => {
    render(<MofDescriptor3DScatter t={THEME_LIGHT} lang="zh" isMobile />)
    const card = screen.getByTestId("home-3d-scatter")
    expect(card.querySelector("svg").getAttribute("aria-label")).toMatch(/3D/)
    expect(card.textContent).not.toMatch(/2D/)
    expect(card.querySelectorAll("circle").length).toBeGreaterThan(5)
  })
})
