import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DatabaseHealthScoreCard } from "../../components/data-quality/DataQualityAuditPanel"

describe("DatabaseHealthScoreCard", () => {
  it("renders health, feature coverage, data readiness, and validation readiness", () => {
    const audit = {
      databaseVersion: "V2.2-Scalable-Database-Preview",
      summary: {
        totalCandidates: 1000,
        descriptorCoverage: 0.72,
        provenanceCoverage: 0.9,
        sourceConfirmedCount: 1000,
        verifiedMetadataCount: 30,
        highRiskRecordCount: 600,
      },
    }
    render(<DatabaseHealthScoreCard audit={audit} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("database-health-score-card")).toBeInTheDocument()
    expect(screen.getByText("Database Health Score")).toBeInTheDocument()
    expect(screen.getByText("Feature coverage")).toBeInTheDocument()
    expect(screen.getByText("Data readiness")).toBeInTheDocument()
    expect(screen.getByText("Validation readiness")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/30/)
  })
})
