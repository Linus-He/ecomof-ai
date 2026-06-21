// @ts-nocheck
import { describe, expect, it } from "vitest"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { buildBenchmarkSplitV2 } from "../../utils/benchmark/buildBenchmarkSplitV2"
import { MODEL_TRAINERS } from "../../utils/benchmark/mlModels"
import { featureVector, FEATURE_KEYS } from "../../utils/dataIngestion/experimentalLabelDataset"
import { buildModelExplainability, explainLogistic, explainDecisionTree, explainRandomForest } from "../../utils/benchmark/modelExplainability"

const split = buildBenchmarkSplitV2({ records: labelData.labels, externalTest: externalData.records })
const trainX = split.trainRecords.map(featureVector)
const trainY = split.trainRecords.map(r => (r.groundTruthClass === "promising" ? 1 : 0))
const fitted = {
  "Logistic Regression": MODEL_TRAINERS["Logistic Regression"](trainX, trainY),
  "Decision Tree": MODEL_TRAINERS["Decision Tree"](trainX, trainY),
  "Random Forest": MODEL_TRAINERS["Random Forest"](trainX, trainY),
}

describe("Model Explainability", () => {
  it("explains Logistic Regression with signed coefficients", () => {
    const lr = explainLogistic(fitted["Logistic Regression"])
    expect(lr.coefficients).toHaveLength(FEATURE_KEYS.length)
    expect(lr.positiveContributions.length + lr.negativeContributions.length).toBe(FEATURE_KEYS.length)
    expect(lr.coefficients.every(c => c.direction === "positive" || c.direction === "negative")).toBe(true)
  })

  it("explains the Decision Tree with a decision path + split importance", () => {
    const dt = explainDecisionTree(fitted["Decision Tree"], { sampleRecord: split.externalTestRecords[0] })
    expect(dt.decisionPath.length).toBeGreaterThan(0)
    expect(dt.decisionPath[dt.decisionPath.length - 1]).toHaveProperty("leaf", true)
    expect(dt.splitImportance.reduce((a, s) => a + s.splits, 0)).toBe(dt.totalSplits)
  })

  it("explains the Random Forest with importance + a tree-consensus level", () => {
    const rf = explainRandomForest(fitted["Random Forest"], { records: split.externalTestRecords })
    expect(rf.featureImportance.length).toBe(FEATURE_KEYS.length)
    expect(rf.treeConsensus).toBeGreaterThanOrEqual(0)
    expect(["High", "Moderate", "Low"]).toContain(rf.consensusLevel)
  })

  it("combines all three with a why-Random-Forest explanation", () => {
    const e = buildModelExplainability({ fitted, evalRecords: split.externalTestRecords })
    expect(e.logisticRegression).toBeTruthy()
    expect(e.decisionTree).toBeTruthy()
    expect(e.randomForest).toBeTruthy()
    expect(e.whyRandomForestFirst).toMatch(/Random Forest/)
  })
})
