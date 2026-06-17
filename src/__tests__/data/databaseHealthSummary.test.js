import { describe, expect, it } from "vitest"
import audit from "../../../public/data/database_precompute/v2_2/scalable_database_quality_audit.json"
import health from "../../../public/data/database_precompute/v2_2/scalable_database_health_summary.json"

describe("V2.2 database health summary", () => {
  it("matches the quality audit totals and stays preview-only", () => {
    expect(health.candidateCount).toBe(audit.summary.totalCandidates)
    expect(health.verifiedMetadataCount).toBe(audit.summary.verifiedMetadataCount)
    expect(health.sourceConfirmedCount).toBe(audit.summary.sourceConfirmedCount)
    expect(health.highRiskRecordCount).toBe(audit.summary.highRiskRecordCount)
    expect(health.healthScore).toBeGreaterThan(0)
    expect(health.healthScore).toBeLessThanOrEqual(1)
    expect(health.notFinalRecommendation).toBe(true)
    expect(health.previewLabel).toBe("Database Preview")
    expect(health.notFinalRecommendationLabel).toBe("Not Final Recommendation")
  })
})
