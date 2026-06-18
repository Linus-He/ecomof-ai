// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import { buildBenchmarkReport } from "../../utils/benchmark/benchmarkRunner"
import { runDataAudit } from "../../utils/dataAudit/index"

describe("First Benchmark Report", () => {
  it("generates a report listing LR / DT / RF with Pending metrics on the real (dataset-derived) labels", () => {
    const audit = runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 })
    const report = audit.benchmarkReport
    expect(report.models.map(m => m.model)).toEqual(["Logistic Regression", "Decision Tree", "Random Forest"])
    expect(report.runnable).toBe(true)
    expect(report.metricsAllowed).toBe(false)
    for (const model of report.models) {
      expect(model.accuracy).toBe("Pending")
      expect(model.rocAuc).toBe("Pending")
      expect(model.leakageStatus).toBe("ok")
    }
    expect(report.overallStatus).toMatch(/Metrics Pending/)
  })

  it("emits real Accuracy fields (not Pending) only when the gates pass", () => {
    const report = buildBenchmarkReport({
      eligibilityAudit: { eligibleConfirmed: 120 },
      labelAudit: { total: 120, realExperimentalLabelCount: 120, invalidGroundTruthCount: 0 },
      split: { complete: true, counts: { train: 84, test: 18 } },
      leakage: { ok: true, leakCount: 0 },
    })
    expect(report.metricsAllowed).toBe(true)
    expect(report.overallStatus).toBe("First Real Benchmark Complete")
    expect(report.models[0].status).toBe("Completed")
  })

  it("blocks the benchmark when conditions are not met", () => {
    const report = buildBenchmarkReport({
      eligibilityAudit: { eligibleConfirmed: 10 },
      labelAudit: { total: 0, invalidGroundTruthCount: 0 },
      split: { complete: false, counts: { train: 0, test: 0 } },
      leakage: { ok: false, leakCount: 5 },
    })
    expect(report.runnable).toBe(false)
    expect(report.overallStatus).toBe("Benchmark Blocked")
    expect(report.models.every(m => m.status === "Benchmark Blocked")).toBe(true)
  })
})
