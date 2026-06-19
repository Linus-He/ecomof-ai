// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import committedReport from "../../../public/data/first_real_benchmark_report_v1.json"
import { buildFirstRealBenchmarkReport } from "../../utils/benchmark/firstRealBenchmarkReport"

const isMetric = v => typeof v === "number" && v >= 0 && v <= 1

describe("First Real Benchmark Report", () => {
  it("meets all acceptance criteria and produces Result A with real metrics", () => {
    const report = buildFirstRealBenchmarkReport({ experimentalLabels: labelData.labels, externalTest: externalData.records })
    expect(report.acceptance.experimentalLabelsOk).toBe(true)
    expect(report.acceptance.verifiedGroundTruthOk).toBe(true)
    expect(report.acceptance.externalTestOk).toBe(true)
    expect(report.acceptance.leakOk).toBe(true)
    expect(report.acceptance.invalidGroundTruthOk).toBe(true)
    expect(report.acceptance.syntheticOk).toBe(true)
    expect(report.acceptance.benchmarkReportGenerated).toBe(true)
    expect(report.result).toBe("A")
    expect(report.metricsAllowed).toBe(true)
    expect(report.leakage.leakCount).toBe(0)
    for (const m of report.models) {
      expect(isMetric(m.accuracy)).toBe(true)
      expect(isMetric(m.f1)).toBe(true)
    }
    expect(report.leaderboard.bestModel).toBeTruthy()
  })

  it("is deterministic — the committed report matches a fresh run", () => {
    const report = buildFirstRealBenchmarkReport({ experimentalLabels: labelData.labels, externalTest: externalData.records })
    expect(report.result).toBe(committedReport.result)
    expect(report.leaderboard.bestModel).toBe(committedReport.leaderboard.bestModel)
    expect(report.models.map(m => m.rocAuc)).toEqual(committedReport.models.map(m => m.rocAuc))
  })

  it("falls back to Result B (Pending) when experimental labels are insufficient", () => {
    const report = buildFirstRealBenchmarkReport({ experimentalLabels: labelData.labels.slice(0, 5), externalTest: externalData.records.slice(0, 3) })
    expect(report.metricsAllowed).toBe(false)
    expect(report.result).toBe("B")
    expect(report.pendingReasons.length).toBeGreaterThan(0)
    for (const m of report.models) expect(m.accuracy).toBe("Pending")
  })
})
