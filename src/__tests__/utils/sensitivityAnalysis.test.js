// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import firstBenchmark from "../../../public/data/first_real_benchmark_report_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { runSensitivityAnalysis } from "../../utils/benchmark/runSensitivityAnalysis"
import { FEATURE_KEYS } from "../../utils/dataIngestion/experimentalLabelDataset"

const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })

describe("Sensitivity Analysis", () => {
  it("retrains with each feature removed and measures the held-out drop", () => {
    const s = runSensitivityAnalysis({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: "Random Forest" })
    expect(s.features).toHaveLength(FEATURE_KEYS.length)
    for (const f of s.features) expect(typeof f.accuracyDrop).toBe("number")
  })

  it("reproduces the frozen V3.4 external baseline (does not modify the benchmark)", () => {
    const s = runSensitivityAnalysis({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: "Random Forest" })
    const rfRow = firstBenchmark.models.find(m => m.model === "Random Forest")
    expect(s.baseline.accuracy).toBeCloseTo(rfRow.accuracy, 4)
    expect(s.baseline.rocAuc).toBeCloseTo(rfRow.rocAuc, 4)
  })

  it("ranks features by accuracy drop (most important first)", () => {
    const s = runSensitivityAnalysis({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: "Random Forest" })
    for (let i = 1; i < s.features.length; i += 1) expect(s.features[i - 1].accuracyDrop).toBeGreaterThanOrEqual(s.features[i].accuracyDrop)
  })
})
