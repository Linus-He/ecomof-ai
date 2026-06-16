// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import records from "../../../public/data/database_precompute/v2_1/medium_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_1/medium_database_preview_summary.json"
import { ModelValidationLab } from "../../components/methodology/model-validation/ModelValidationLab"

function renderLab(props = {}) {
  return render(
    <ModelValidationLab
      records={records}
      summary={summary}
      lang="en"
      t={THEME_LIGHT}
      isMobile={false}
      {...props}
    />,
  )
}

function bodyText() {
  return document.body.textContent || ""
}

describe("ModelValidationLab", () => {
  it("renders as an independent deep-link target with every V2.1 validation submodule", () => {
    renderLab()

    expect(screen.getByTestId("methodology-model-validation")).toHaveAttribute("id", "methodology-model-validation")
    for (const id of [
      "methodology-evolution-timeline",
      "methodology-model-feature-pipeline",
      "methodology-feature-selection-explorer",
      "methodology-model-comparison-dashboard",
      "methodology-explainability-trust-map",
      "methodology-validation-workflow",
      "methodology-confidence-analysis",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })

  it("keeps the lab explicitly labeled as preview-only and not a final recommendation", () => {
    renderLab()

    expect(bodyText()).toMatch(/Database Preview/i)
    expect(bodyText()).toMatch(/Not Final Recommendation/i)
    expect(bodyText()).toMatch(/Validation Pending/i)
    expect(bodyText()).toMatch(/250 candidates/i)
  })

  it("does not expose formal Accuracy or ROC metrics without real labels", () => {
    renderLab()

    expect(bodyText()).not.toMatch(/\bAccuracy\b/i)
    expect(bodyText()).not.toMatch(/\bROC\b/i)
    expect(bodyText()).toMatch(/formal predictive metrics are withheld/i)
  })

  it("renders all mobile sections without losing the scrollable model comparison shell", () => {
    renderLab({ isMobile: true })

    expect(screen.getByTestId("methodology-model-validation").style.minWidth).toMatch(/^0(px)?$/)
    expect(screen.getByTestId("methodology-model-comparison-dashboard").querySelector("table")).toBeTruthy()
    expect(bodyText()).toMatch(/Confidence & Uncertainty Analysis/i)
  })
})
