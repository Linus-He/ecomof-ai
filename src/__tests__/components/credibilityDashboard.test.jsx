// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import credibility from "../../../public/data/model_credibility_report_v1.json"
import { CredibilityDashboard } from "../../components/methodology/model-credibility/CredibilityDashboard"

const body = () => document.body.textContent || ""

describe("CredibilityDashboard", () => {
  it("shows the credibility score, grade, components, and benchmark credibility audit", () => {
    render(<CredibilityDashboard credibility={credibility} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("algval-credibility")).toBeInTheDocument()
    expect(screen.getByTestId("credibility-score")).toBeInTheDocument()
    expect(screen.getByTestId("benchmark-credibility-audit")).toBeInTheDocument()
    expect(body()).toMatch(new RegExp(`Grade ${credibility.credibility.grade}`))
    expect(body()).toMatch(/Cross Validation/)
    expect(body()).toMatch(/Known Limitations/)
  })

  it("renders nothing without a report", () => {
    const { container } = render(<CredibilityDashboard credibility={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
