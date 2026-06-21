// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import robustness from "../../../public/data/model_robustness_report_v1.json"
import { RobustnessDashboard } from "../../components/methodology/model-robustness/RobustnessDashboard"

const body = () => document.body.textContent || ""

describe("RobustnessDashboard", () => {
  it("renders the robustness section with growth, reliability, ranking, and the three figures", () => {
    render(<RobustnessDashboard robustness={robustness} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("algval-robustness")).toBeInTheDocument()
    expect(screen.getByTestId("robustness-figure")).toBeInTheDocument()
    expect(screen.getByTestId("confidence-figure")).toBeInTheDocument()
    expect(screen.getByTestId("generalization-figure")).toBeInTheDocument()
    expect(screen.getByTestId("robustness-cv-table")).toBeInTheDocument()
    expect(body()).toMatch(/Reliability Score/)
    expect(body()).toMatch(/Experimental Label Growth/)
    expect(body()).toMatch(new RegExp(robustness.bestModel))
  })

  it("renders nothing without a report", () => {
    const { container } = render(<RobustnessDashboard robustness={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
