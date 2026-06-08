// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildScoringBoundaryNotice,
  buildWorkerScoringRequest,
  buildWorkerScoringTrace,
  canRunBrowserScoring,
  runLoadedScopeDryRun,
} from "../../utils/databaseIndex/databaseScoringBoundary"

describe("database scoring boundary", () => {
  it("blocks full database scoring in the browser", () => {
    const boundary = canRunBrowserScoring("full_database_precompute_required")
    expect(boundary.browserAllowed).toBe(false)
    expect(boundary.reason).toBe("Full database scoring must be precomputed or run outside the browser main thread.")
    expect(boundary.reasonZh).toBe("全量数据库评分必须预计算，或在浏览器主线程之外执行。")
    expect(buildScoringBoundaryNotice("full_database_precompute_required", "zh")).toBe(boundary.reasonZh)
  })

  it("builds a selected-index-part worker request", () => {
    const request = buildWorkerScoringRequest([
      { id: "COREMOF_000001", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000001", displayName: "MIL-53(Al)", dataQualityStatus: "ready_for_scoring", descriptorCompleteness: { percent: 80 }, provenanceStatus: "partial", oacsPreview: 0.8 },
    ], { scope: "selected_index_part", requestId: "test-request", createdAt: "2026-06-08T00:00:00.000Z" })

    expect(request.browserAllowed).toBe(true)
    expect(request.scope).toBe("selected_index_part")
    expect(request.recordCount).toBe(1)
    expect(request.records[0]).toEqual(expect.objectContaining({
      id: "COREMOF_000001",
      notFinalRecommendation: true,
    }))
  })

  it("creates a not-final worker trace from dry-run output", () => {
    const request = buildWorkerScoringRequest([
      { id: "COREMOF_000001", dataQualityStatus: "ready_for_scoring", descriptorCompleteness: { percent: 80 }, provenanceStatus: "partial", oacsPreview: 0.8 },
      { id: "COREMOF_000002", dataQualityStatus: "rejected", descriptorCompleteness: { percent: 80 }, provenanceStatus: "partial", oacsPreview: 0.5 },
    ], { scope: "selected_index_part" })
    const result = runLoadedScopeDryRun(request)
    const trace = buildWorkerScoringTrace(result)

    expect(result.inputRecordCount).toBe(2)
    expect(result.scoredRecordCount).toBe(1)
    expect(result.skippedRecordCount).toBe(1)
    expect(trace).toEqual(expect.objectContaining({
      scope: "selected_index_part",
      inputRecordCount: 2,
      scoredRecordCount: 1,
      skippedRecordCount: 1,
      notFinalRecommendation: true,
    }))
  })
})
