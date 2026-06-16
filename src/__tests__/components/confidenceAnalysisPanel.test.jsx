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

describe("ConfidenceAnalysisPanel", () => {
  it("summarizes uncertainty drivers without claiming validated performance", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("methodology-confidence-analysis")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Overall Confidence Score/i)
    expect(bodyText()).toMatch(/Verified Metadata\s*0\/250/i)
    expect(bodyText()).toMatch(/Ambiguity Risk/i)
    expect(bodyText()).toMatch(/Missing Field Impact/i)
    expect(bodyText()).toMatch(/Not 100 because real labels, external validation, verified metadata, and several fields are missing/i)
  })

  it("keeps verifiedMetadataCount at zero for V2.1 preview input", () => {
    render(<ModelValidationLab records={records} summary={summary} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(summary.verifiedMetadataCount).toBe(0)
    expect(records.every(record => record.verifiedMetadata === false)).toBe(true)
    expect(bodyText()).not.toMatch(/Verified Screening/i)
  })
})
