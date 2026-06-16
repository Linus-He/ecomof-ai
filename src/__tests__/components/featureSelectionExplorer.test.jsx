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

describe("FeatureSelectionExplorer", () => {
  it("supports searching and category filtering for descriptor selection", () => {
    renderLab()

    fireEvent.change(screen.getByPlaceholderText(/Search descriptor/i), { target: { value: "band" } })
    expect(bodyText()).toMatch(/Band Gap/i)
    expect(bodyText()).not.toMatch(/Metal Node/i)

    fireEvent.change(screen.getByDisplayValue("All"), { target: { value: "Electronic" } })
    expect(bodyText()).toMatch(/Electronic/i)
  })

  it("opens field-level provenance from descriptor rows", async () => {
    renderLab()

    const sourceButtons = screen.getAllByRole("button", { name: /View field provenance for Surface Area/i })
    fireEvent.click(sourceButtons[0])

    const panel = await screen.findByRole("dialog", { name: /Field-level provenance/i })
    expect(panel).toHaveTextContent(/Field: Surface Area/i)
    expect(panel).toHaveTextContent(/Source database/i)
    expect(panel).toHaveTextContent(/Scoring eligible/i)
    expect(panel).toHaveTextContent(/Blocks verified metadata/i)
  })
})
