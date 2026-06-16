// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import records from "../../../public/data/database_precompute/v2_1/medium_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_1/medium_database_preview_summary.json"
import { ModelValidationLab } from "../../components/methodology/model-validation/ModelValidationLab"

function renderLab() {
  return render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)
}

function bodyText() {
  return document.body.textContent || ""
}

describe("MethodologyEvolutionTimeline", () => {
  it("shows the required methodology version timeline", () => {
    renderLab()

    expect(screen.getByTestId("methodology-evolution-timeline")).toBeInTheDocument()
    for (const label of ["V1.0", "V1.5", "V2.0-K", "V2.0-L", "V2.0-M", "V2.1", "Future"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
    expect(bodyText()).toMatch(/Model Validation Lab, Feature Selection Explorer, Model Comparison Dashboard, Confidence Analysis/i)
    expect(bodyText()).toMatch(/250-record Database Preview with field-level provenance/i)
  })

  it("updates detail content when another version is selected", () => {
    renderLab()

    fireEvent.click(screen.getByRole("button", { name: "V2.0-L" }))
    expect(bodyText()).toMatch(/Manual Source Curation, Source Confirmed Workflow, Citation Ready Tracking/i)
    expect(bodyText()).toMatch(/source_confirmed and citation_ready from verified_metadata/i)
  })
})
