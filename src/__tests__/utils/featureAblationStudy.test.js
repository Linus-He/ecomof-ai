// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { buildFeatureAblationStudy, classifyAblation } from "../../utils/benchmark/featureAblationStudy"
import { FEATURE_KEYS } from "../../utils/dataIngestion/experimentalLabelDataset"

const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })

describe("Feature Ablation Study", () => {
  it("classifies ablation by performance drop", () => {
    expect(classifyAblation(0.08, 0)).toBe("Critical")
    expect(classifyAblation(0.02, 0)).toBe("Useful")
    expect(classifyAblation(0, 0)).toBe("Marginal")
  })

  it("classifies every feature as Critical / Useful / Marginal with a tally", () => {
    const study = buildFeatureAblationStudy({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: "Random Forest" })
    expect(study.rows).toHaveLength(FEATURE_KEYS.length)
    for (const r of study.rows) expect(["Critical", "Useful", "Marginal"]).toContain(r.classification)
    expect(study.tally.Critical + study.tally.Useful + study.tally.Marginal).toBe(FEATURE_KEYS.length)
  })

  it("identifies the driving (Critical) features", () => {
    const study = buildFeatureAblationStudy({ trainRecords: split.trainRecords, evalRecords: split.externalTestRecords, modelName: "Random Forest" })
    expect(Array.isArray(study.criticalFeatures)).toBe(true)
    expect(study.criticalFeatures.length).toBe(study.tally.Critical)
  })
})
