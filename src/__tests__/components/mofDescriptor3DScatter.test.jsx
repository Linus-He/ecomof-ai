import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MofDescriptor3DScatter } from "../../components/home/MofDescriptor3DScatter"
import { THEME_DARK, THEME_LIGHT } from "../../constants/theme"

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
    expect(card.className).toMatch(/descriptor-story-stage/)
    expect(card.textContent).toMatch(/min–max rule/)
    expect(card.textContent).toMatch(/ACTIVE SPACE/)
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

  it("adapts the descriptor stage to independent light and dark themes", () => {
    expect(THEME_DARK).not.toBe(THEME_LIGHT)
    const { rerender } = render(<MofDescriptor3DScatter t={THEME_LIGHT} lang="zh" isMobile={false} />)
    const lightCard = screen.getByTestId("home-3d-scatter")
    expect(lightCard.getAttribute("data-color-scheme")).toBe("light")
    expect(lightCard.style.getPropertyValue("--descriptor-panel")).toBe("#fcfbf7")

    rerender(<MofDescriptor3DScatter t={THEME_DARK} lang="zh" isMobile={false} />)
    const darkCard = screen.getByTestId("home-3d-scatter")
    expect(darkCard.getAttribute("data-color-scheme")).toBe("dark")
    expect(darkCard.style.getPropertyValue("--descriptor-panel")).toBe("#1c1c18")
  })
})
