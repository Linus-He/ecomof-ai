// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import robustness from "../../../public/data/model_robustness_report_v1.json"
import { ConfidenceFigure } from "../../components/methodology/model-robustness/ConfidenceFigure"

const body = () => document.body.textContent || ""

describe("ConfidenceFigure (Figure G)", () => {
  it("renders the 95% CI SVG for accuracy and ROC", () => {
    render(<ConfidenceFigure robustness={robustness} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("confidence-figure")).toBeInTheDocument()
    expect(screen.getByTestId("ci-row-accuracy")).toBeInTheDocument()
    expect(screen.getByTestId("ci-row-rocAuc")).toBeInTheDocument()
    expect(body()).toMatch(/Confidence Interval/i)
  })

  it("renders nothing without a report", () => {
    const { container } = render(<ConfidenceFigure robustness={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
