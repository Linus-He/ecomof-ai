// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import robustness from "../../../public/data/model_robustness_report_v1.json"
import { GeneralizationFigure } from "../../components/methodology/model-robustness/GeneralizationFigure"

const body = () => document.body.textContent || ""

describe("GeneralizationFigure (Figure H)", () => {
  it("renders train/validation/test/external bars with the overfit-risk verdict", () => {
    render(<GeneralizationFigure robustness={robustness} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("generalization-figure")).toBeInTheDocument()
    expect(screen.getByTestId("gen-bar-train")).toBeInTheDocument()
    expect(screen.getByTestId("gen-bar-externalTest")).toBeInTheDocument()
    expect(body()).toMatch(/Overfit risk/i)
    expect(body()).toMatch(new RegExp(robustness.generalization.overfittingRisk))
  })

  it("renders nothing without a report", () => {
    const { container } = render(<GeneralizationFigure robustness={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
