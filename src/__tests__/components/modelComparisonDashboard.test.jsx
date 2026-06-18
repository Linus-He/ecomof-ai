// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import { ModelValidationLab } from "../../components/methodology/model-validation/ModelValidationLab"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

function bodyText() {
  return document.body.textContent || ""
}

describe("ModelComparisonDashboard", () => {
  it("lists baseline methods while keeping formal performance metrics pending", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("methodology-model-comparison-dashboard")).toBeInTheDocument()
    expect(bodyText()).toMatch(/CRITIC-MCDA/i)
    expect(bodyText()).toMatch(/Logistic Regression/i)
    expect(bodyText()).toMatch(/Decision Tree/i)
    expect(bodyText()).toMatch(/Random Forest/i)
    expect(bodyText()).toMatch(/Validation Pending/i)
    expect(bodyText()).toMatch(/Demo Only/i)
    expect(bodyText()).toMatch(/Framework Ready/i)
    expect(bodyText()).toMatch(/Accuracy: pending/i)
    expect(bodyText()).toMatch(/ROC-AUC: pending/i)
    expect(bodyText()).toMatch(/F1: pending/i)
    expect(bodyText()).toMatch(/External Test: pending/i)
    expect(bodyText()).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
    expect(bodyText()).not.toMatch(/ROC-AUC:\s*(0\.\d+|[1-9]\d?%?)/i)
  })

  it("keeps model comparison separate from final recommendation language", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(bodyText()).toMatch(/Not Final Recommendation/i)
    expect(bodyText()).not.toMatch(/final recommended model/i)
    expect(bodyText()).not.toMatch(/validated best model/i)
  })

  it("renders the V2.7 interactive model comparison dashboard", () => {
    renderBenchmarkLab()

    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/CRITIC/)
    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Bayesian Regression/)
    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Logistic Regression/)
    expect(screen.getByTestId("model-comparison-dashboard-v27")).toHaveTextContent(/Accuracy \/ ROC-AUC: Pending/)
  })
})
