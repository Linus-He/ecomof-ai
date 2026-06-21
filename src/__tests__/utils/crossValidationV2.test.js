// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelsV2 from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import { runCrossValidationV2, repeatedCrossValidation } from "../../utils/benchmark/crossValidationRunnerV2"
import { BENCHMARK_MODELS } from "../../utils/benchmark/runRealBenchmark"

const records = labelsV2.labels.slice(0, 60)

describe("Cross Validation V2", () => {
  it("runs 5-fold, 10-fold, and repeated 5-fold", () => {
    const cv = runCrossValidationV2({ records, repeats: 3 })
    expect(cv.fiveFold.k).toBe(5)
    expect(cv.tenFold.k).toBe(10)
    expect(cv.repeatedFiveFold.repeats).toBe(3)
    expect(cv.repeatedFiveFold.totalFolds).toBe(15)
  })

  it("aggregates repeated-CV metrics with mean and std per model", () => {
    const rep = repeatedCrossValidation({ records, folds: 5, repeats: 3 })
    expect(rep.models.map(m => m.model)).toEqual(BENCHMARK_MODELS)
    for (const m of rep.models) {
      expect(m.accuracyMean).toBeGreaterThanOrEqual(0)
      expect(m.accuracyMean).toBeLessThanOrEqual(1)
      expect(m.accuracyStd).toBeGreaterThanOrEqual(0)
      expect(m.foldCount).toBe(15)
    }
  })

  it("is deterministic", () => {
    const a = repeatedCrossValidation({ records, folds: 5, repeats: 3 })
    const b = repeatedCrossValidation({ records, folds: 5, repeats: 3 })
    expect(a.models.map(m => m.accuracyMean)).toEqual(b.models.map(m => m.accuracyMean))
  })
})
