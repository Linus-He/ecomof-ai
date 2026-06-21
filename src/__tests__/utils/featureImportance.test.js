// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { MODEL_TRAINERS } from "../../utils/benchmark/mlModels"
import { featureVector, FEATURE_KEYS } from "../../utils/dataIngestion/experimentalLabelDataset"
import { buildFeatureImportance, permutationImportance } from "../../utils/benchmark/featureImportance"

const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })
const trainX = split.trainRecords.map(featureVector)
const trainY = split.trainRecords.map(r => (r.groundTruthClass === "promising" ? 1 : 0))
const rf = MODEL_TRAINERS["Random Forest"](trainX, trainY)

describe("Feature Importance", () => {
  it("computes one importance per real model feature, ranked descending", () => {
    const fi = buildFeatureImportance({ model: rf, records: split.externalTestRecords })
    expect(fi.rows).toHaveLength(FEATURE_KEYS.length)
    expect(fi.method).toBe("permutation_importance")
    for (let i = 1; i < fi.rows.length; i += 1) expect(fi.rows[i - 1].importance).toBeGreaterThanOrEqual(fi.rows[i].importance)
    fi.rows.forEach((r, i) => { expect(r.rank).toBe(i + 1); expect(r.importance).toBeGreaterThanOrEqual(0) })
  })

  it("contributions sum to ~1 and only reports the features the model used", () => {
    const fi = buildFeatureImportance({ model: rf, records: split.externalTestRecords })
    const sum = fi.rows.reduce((a, r) => a + r.contribution, 0)
    expect(sum).toBeGreaterThan(0.99)
    expect(sum).toBeLessThan(1.01)
    expect(fi.rows.map(r => r.feature).sort()).toEqual([...FEATURE_KEYS].sort())
  })

  it("permutation importance is deterministic", () => {
    const a = permutationImportance({ model: rf, X: split.externalTestRecords.map(featureVector), y: split.externalTestRecords.map(r => (r.groundTruthClass === "promising" ? 1 : 0)) })
    const b = permutationImportance({ model: rf, X: split.externalTestRecords.map(featureVector), y: split.externalTestRecords.map(r => (r.groundTruthClass === "promising" ? 1 : 0)) })
    expect(a.map(r => r.importance)).toEqual(b.map(r => r.importance))
  })
})
