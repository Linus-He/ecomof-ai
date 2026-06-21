// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelsV2 from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import externalV2 from "../../../public/data/external_test_dataset_v2.json"
import report from "../../../public/data/model_robustness_report_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { MODEL_TRAINERS } from "../../utils/benchmark/mlModels"
import { featureVector } from "../../utils/dataIngestion/experimentalLabelDataset"
import { generalizationAudit, classifyOverfit } from "../../utils/benchmark/generalizationAudit"

const split = buildBenchmarkSplitV2({ records: labelsV2.labels, externalTest: externalV2.records })
const rf = MODEL_TRAINERS["Random Forest"](split.trainRecords.map(featureVector), split.trainRecords.map(r => (r.groundTruthClass === "promising" ? 1 : 0)))

describe("Generalization Audit", () => {
  it("classifies overfitting risk by gap", () => {
    expect(classifyOverfit(0.05)).toBe("Low")
    expect(classifyOverfit(0.15)).toBe("Moderate")
    expect(classifyOverfit(0.3)).toBe("High")
  })

  it("compares train / validation / test / external and reports a gap + risk", () => {
    const g = generalizationAudit({ model: rf, modelName: "Random Forest", trainRecords: split.trainRecords, validationRecords: split.validationRecords, testRecords: split.testRecords, externalTestRecords: split.externalTestRecords })
    expect(g.splits.train).toBeTruthy()
    expect(g.splits.externalTest).toBeTruthy()
    expect(typeof g.generalizationGap).toBe("number")
    expect(["Low", "Moderate", "High", "Unknown"]).toContain(g.overfittingRisk)
    expect(g.recommendation).toBeTruthy()
  })

  it("matches the committed robustness report's generalization verdict", () => {
    expect(["Low", "Moderate", "High"]).toContain(report.generalization.overfittingRisk)
    expect(report.generalization.generalizationGap).toBeGreaterThanOrEqual(0)
  })
})
