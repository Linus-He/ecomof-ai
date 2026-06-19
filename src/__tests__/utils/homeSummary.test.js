import { describe, expect, it } from "vitest"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import {
  buildHomeSummary,
  DEFAULT_HOME_SUMMARY,
  formatStatus,
} from "../../utils/homeSummary"

describe("homeSummary", () => {
  it("builds the homepage V3.3 status from lightweight summaries", () => {
    const summary = buildHomeSummary({ homeSummary, dataIngestionSummary, versionEvolution })

    expect(summary.currentVersion).toBe("V3.3")
    expect(summary.totalRecords).toBe(3020)
    expect(summary.coreMofRecords).toBe(1240)
    expect(summary.qmofRecords).toBe(1240)
    expect(summary.organicAcidLiteratureRecords).toBe(540)
    expect(summary.verifiedMetadataCount).toBe(2480)
    expect(summary.goldDatasetCount).toBe(320)
    expect(summary.reactionDatasetCount).toBe(520)
    expect(summary.experimentalLabelCount).toBe(0)
    expect(summary.accuracyStatus).toBe("pending")
    expect(summary.rocAucStatus).toBe("pending")
    expect(summary.notFinalRecommendation).toBe(true)
    expect(summary.databasePreview).toBe(true)
  })

  it("keeps public home_summary.json lightweight", () => {
    expect(JSON.stringify(homeSummary).length).toBeLessThan(50 * 1024)
  })

  it("falls back to pending and default V3.3 values when optional summaries are unavailable", () => {
    const summary = buildHomeSummary({})

    expect(summary).toMatchObject(DEFAULT_HOME_SUMMARY)
    expect(formatStatus(summary.accuracyStatus)).toBe("Pending")
    expect(formatStatus(summary.rocAucStatus)).toBe("Pending")
  })
})
