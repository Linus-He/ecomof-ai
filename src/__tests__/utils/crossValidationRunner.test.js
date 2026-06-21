// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import { runCrossValidation, kFoldIndices } from "../../utils/benchmark/crossValidationRunner"
import { BENCHMARK_MODELS } from "../../utils/benchmark/runRealBenchmark"

describe("Cross Validation Runner", () => {
  it("partitions all indices into k disjoint folds", () => {
    const folds = kFoldIndices(40, 5)
    expect(folds).toHaveLength(5)
    const all = folds.flat().sort((a, b) => a - b)
    expect(all).toEqual(Array.from({ length: 40 }, (_, i) => i))
  })

  it("runs 5-fold CV for all three models with mean/std and a stability score", () => {
    const cv = runCrossValidation({ records: labelData.labels, folds: 5 })
    expect(cv.k).toBe(5)
    expect(cv.models.map(m => m.model)).toEqual(BENCHMARK_MODELS)
    for (const m of cv.models) {
      expect(m.folds.length).toBe(5)
      expect(m.accuracyMean).toBeGreaterThanOrEqual(0)
      expect(m.accuracyMean).toBeLessThanOrEqual(1)
      expect(m.accuracyStd).toBeGreaterThanOrEqual(0)
      expect(m.stabilityScore).toBeGreaterThanOrEqual(0)
      expect(m.stabilityScore).toBeLessThanOrEqual(1)
    }
  })

  it("runs 10-fold CV", () => {
    const cv = runCrossValidation({ records: labelData.labels, folds: 10 })
    expect(cv.k).toBe(10)
    expect(cv.models[0].folds.length).toBe(10)
  })

  it("is deterministic", () => {
    const a = runCrossValidation({ records: labelData.labels, folds: 5 })
    const b = runCrossValidation({ records: labelData.labels, folds: 5 })
    expect(a.models.map(m => m.accuracyMean)).toEqual(b.models.map(m => m.accuracyMean))
  })
})
