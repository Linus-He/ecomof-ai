import { describe, expect, it } from "vitest"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import {
  buildHomeSummary,
  DEFAULT_HOME_SUMMARY,
  formatStatus,
} from "../../utils/homeSummary"

describe("homeSummary", () => {
  it("builds the homepage product overview data from lightweight summaries", () => {
    const summary = buildHomeSummary({ homeSummary, dataIngestionSummary })

    expect(summary.totalRecords).toBe(10277)
    expect(summary.coreMofRecords).toBe(9835)
    expect(summary.fairMofsRecords).toBe(4168)
    expect(summary.fairMofsDoiRecords).toBe(4168)
    expect(summary.fairMofsPorePropertyRecords).toBe(787)
    expect(summary.gasAdsorptionRecords).toBe(442)
    expect(summary.qmofRecords).toBe(0)
    expect(summary.organicAcidLiteratureRecords).toBe(0)
    expect(summary.verifiedMetadataCount).toBe(9835)
    expect(summary.goldDatasetCount).toBe(0)
    expect(summary.reactionDatasetCount).toBe(0)
    expect(summary.qmofStatus).toBe("quarantined")
    expect(summary.experimentalLabelCount).toBe(150)
    expect(summary.externalTestCount).toBe(80)
    expect(summary.benchmarkEligibleCount).toBe(230)
    expect(summary.currentVersion).toBe("V3.10.1")
    expect(summary.bestModel).toBe("Random Forest")
    expect(summary.credibilityScore).toBe(78.87)
    expect(summary.credibilityGrade).toBe("B")
    expect(summary.currentRisk).toBe("High Overfitting Risk")
    expect(summary.benchmarkStatus).toBe("available")
    expect(summary.modelValidationStatus).toBe("ongoing")
    expect(summary.accuracyStatus).toBe("held_in_validation_center")
    expect(summary.rocAucStatus).toBe("held_in_validation_center")
    expect(summary.notFinalRecommendation).toBe(true)
    expect(summary.databasePreview).toBe(true)
  })

  it("keeps public home_summary.json lightweight", () => {
    expect(JSON.stringify(homeSummary).length).toBeLessThan(50 * 1024)
  })

  it("falls back to product overview defaults when optional summaries are unavailable", () => {
    const summary = buildHomeSummary({})

    expect(summary).toMatchObject(DEFAULT_HOME_SUMMARY)
    expect(formatStatus(summary.accuracyStatus)).toBe("Held In Validation Center")
    expect(formatStatus(summary.rocAucStatus)).toBe("Held In Validation Center")
  })
})
