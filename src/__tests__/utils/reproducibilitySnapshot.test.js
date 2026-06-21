import { describe, expect, it } from "vitest"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { buildRunSnapshot } from "../../utils/researchReports"

describe("reproducibility snapshot", () => {
  it("records run id, database version, method version, validation version, timestamp, candidate count, and verified metadata count", () => {
    const snapshot = buildRunSnapshot({ summary, versionData, timestamp: "2026-06-17T08:00:00.000Z" })

    expect(snapshot.runId).toBe("research-report-20260617080000")
    expect(snapshot.databaseVersion).toBe(summary.version)
    expect(snapshot.methodVersion).toBe("V3.8")
    expect(snapshot.validationVersion).toMatch(/Verified Metadata Framework V3.8/)
    expect(snapshot.timestamp).toBe("2026-06-17T08:00:00.000Z")
    expect(snapshot.candidateCount).toBe(1000)
    expect(snapshot.verifiedMetadataCount).toBe(30)
  })
})
