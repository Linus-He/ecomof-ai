// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { SynergyHotSpotMap } from "../../components/catalysis/organic-acid-final/SynergyHotSpotMap"

const data = [
  { label: "Al-MOF@Mo", metal: "Mo", x: 0.7, y: 0.82, frameworkRobustness: 0.7, metalOxoActivity: 0.82, synergyScore: 0.61, role: "primary hypothesis" },
  { label: "Al-MOF@W", metal: "W", x: 0.7, y: 0.66, frameworkRobustness: 0.7, metalOxoActivity: 0.66, synergyScore: 0.44, role: "backup hypothesis" },
  { label: "Al-MOF@V", metal: "V", x: 0.7, y: 0.55, frameworkRobustness: 0.7, metalOxoActivity: 0.55, synergyScore: 0.36, role: "competitive metal" },
]

describe("SynergyHotSpotMap (OACS-DMRS Candidate Priority Map)", () => {
  it("renders the scientific priority map without a mascot", () => {
    const { container } = render(<SynergyHotSpotMap data={data} region={{}} lang="en" t={THEME_LIGHT} />)

    expect(screen.getByText("OACS–DMRS Candidate Priority Map")).toBeTruthy()
    expect(screen.getByText(/This map visualizes currently loaded candidates only/)).toBeTruthy()
    expect(screen.getAllByText("Priority validation").length).toBeGreaterThan(0)
    expect(screen.getByText("Primary hypothesis")).toBeTruthy()

    // No mascot / cat probe anywhere in the chart.
    expect(container.querySelector('[data-testid="catalysis-cat-probe"]')).toBeNull()
    expect(container.querySelector('[aria-label*="cat" i]')).toBeNull()
    // The plot itself is present.
    expect(container.querySelector('[aria-label="OACS-DMRS Candidate Priority Map"]')).toBeTruthy()
  })

  it("renders Chinese priority-map copy", () => {
    render(<SynergyHotSpotMap data={data} region={{}} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("OACS–DMRS 候选优先级地图")).toBeTruthy()
    expect(screen.getByText(/不代表经完整验证的全量数据库筛选/)).toBeTruthy()
  })
})
