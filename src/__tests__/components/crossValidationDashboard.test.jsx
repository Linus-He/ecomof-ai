// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import credibility from "../../../public/data/model_credibility_report_v1.json"
import { CrossValidationDashboard } from "../../components/methodology/model-credibility/CrossValidationDashboard"

const body = () => document.body.textContent || ""

describe("CrossValidationDashboard", () => {
  it("renders 5-fold per-model tables with mean/std", () => {
    render(<CrossValidationDashboard credibility={credibility} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("algval-cross-validation")).toBeInTheDocument()
    expect(screen.getByTestId("cv-model-Random-Forest")).toBeInTheDocument()
    expect(body()).toMatch(/Logistic Regression/)
    expect(body()).toMatch(/Decision Tree/)
    expect(body()).toMatch(/Mean ± Std/)
  })

  it("switches between 5-fold and 10-fold", () => {
    render(<CrossValidationDashboard credibility={credibility} lang="en" t={THEME_LIGHT} isMobile={false} />)
    fireEvent.click(screen.getByTestId("cv-fold-tenFold"))
    expect(screen.getByTestId("cv-fold-tenFold")).toHaveAttribute("aria-pressed", "true")
  })

  it("renders nothing without a report", () => {
    const { container } = render(<CrossValidationDashboard credibility={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
