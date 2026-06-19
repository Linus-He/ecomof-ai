// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { runRealBenchmark, encodeClass, BENCHMARK_MODELS } from "../../utils/benchmark/runRealBenchmark"

const inRange = v => typeof v === "number" && v >= 0 && v <= 1

describe("runRealBenchmark", () => {
  const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })

  it("fits all three models and reports the four sizes", () => {
    const result = runRealBenchmark({
      trainRecords: split.trainRecords,
      validationRecords: split.validationRecords,
      testRecords: split.testRecords,
      externalTestRecords: split.externalTestRecords,
      metricsAllowed: true,
    })
    expect(result.models.map(m => m.model)).toEqual(BENCHMARK_MODELS)
    expect(result.canRun).toBe(true)
    for (const m of result.models) {
      expect(m.trained).toBe(true)
      expect(m.trainSize).toBe(split.trainRecords.length)
      expect(m.testSize).toBe(split.testRecords.length)
      expect(m.externalTestSize).toBe(split.externalTestRecords.length)
      // real metrics in [0, 1]
      expect(inRange(m.externalMetrics.accuracy)).toBe(true)
      expect(inRange(m.externalMetrics.f1)).toBe(true)
      expect(m.externalMetrics.rocAuc === null || inRange(m.externalMetrics.rocAuc)).toBe(true)
    }
  })

  it("keeps metrics hidden (Pending) when the gate is not allowed", () => {
    const result = runRealBenchmark({ trainRecords: split.trainRecords, testRecords: split.testRecords, externalTestRecords: split.externalTestRecords, metricsAllowed: false })
    for (const m of result.models) expect(m.externalMetrics).toBeNull()
  })

  it("encodes the binary class", () => {
    expect(encodeClass("promising")).toBe(1)
    expect(encodeClass("not_promising")).toBe(0)
  })
})
