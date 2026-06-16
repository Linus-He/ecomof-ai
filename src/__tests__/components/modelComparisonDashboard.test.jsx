// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import records from "../../../public/data/database_precompute/v2_1/medium_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_1/medium_database_preview_summary.json"
import { ModelValidationLab } from "../../components/methodology/model-validation/ModelValidationLab"

function bodyText() {
  return document.body.textContent || ""
}

describe("ModelComparisonDashboard", () => {
  it("lists baseline methods without presenting formal performance metrics", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("methodology-model-comparison-dashboard")).toBeInTheDocument()
    expect(bodyText()).toMatch(/CRITIC-MCDA/i)
    expect(bodyText()).toMatch(/Logistic Regression/i)
    expect(bodyText()).toMatch(/Decision Tree/i)
    expect(bodyText()).toMatch(/Random Forest/i)
    expect(bodyText()).toMatch(/Validation Pending/i)
    expect(bodyText()).toMatch(/Demo Only/i)
    expect(bodyText()).toMatch(/Framework Ready/i)
    expect(bodyText()).not.toMatch(/\bAccuracy\b/i)
    expect(bodyText()).not.toMatch(/\bROC\b/i)
  })

  it("keeps model comparison separate from final recommendation language", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(bodyText()).toMatch(/Not Final Recommendation/i)
    expect(bodyText()).not.toMatch(/final recommended model/i)
    expect(bodyText()).not.toMatch(/validated best model/i)
  })
})
