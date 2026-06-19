// @ts-nocheck
import { describe, expect, it } from "vitest"
import dataset from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import {
  buildExperimentalLabelDataset,
  validateExperimentalLabel,
  isForbiddenSource,
  isExperimentalSource,
  featureVector,
  FEATURE_KEYS,
} from "../../utils/dataIngestion/experimentalLabelDataset"

describe("Experimental Label Dataset", () => {
  it("the committed experimental labels are all valid and non-synthetic", () => {
    const built = buildExperimentalLabelDataset(dataset.labels)
    expect(built.labels.length).toBeGreaterThanOrEqual(30)
    expect(built.invalid.length).toBe(0)
    expect(built.summary.syntheticCount).toBe(0)
    for (const label of built.labels) {
      expect(isExperimentalSource(label.sourceType)).toBe(true)
      expect(label.syntheticFixture).not.toBe(true)
    }
  })

  it("rejects algorithm/recommendation/derived/synthetic sources", () => {
    expect(validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "binary", groundTruthClass: "promising", sourceType: "algorithm_generated", sourceCitation: "x" }).valid).toBe(false)
    expect(validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "binary", groundTruthClass: "promising", sourceType: "recommendation", sourceCitation: "x" }).valid).toBe(false)
    expect(isForbiddenSource("derived_dataset")).toBe(true)
    expect(isForbiddenSource("model_score")).toBe(true)
  })

  it("rejects a synthetic fixture even with a valid source", () => {
    const check = validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "binary", groundTruthClass: "promising", sourceType: "expert_review", sourceCitation: "x", syntheticFixture: true })
    expect(check.valid).toBe(false)
  })

  it("validates label types and ground-truth requirements", () => {
    expect(validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "binary", sourceType: "expert_review", sourceCitation: "x" }).valid).toBe(false) // no class
    expect(validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "regression", sourceType: "expert_review", sourceCitation: "x", groundTruthValue: 42 }).valid).toBe(true)
    expect(validateExperimentalLabel({ labelId: "a", candidateId: "c", labelType: "weird", sourceType: "expert_review", sourceCitation: "x", groundTruthClass: "p" }).valid).toBe(false)
  })

  it("produces a fixed-length numeric feature vector with no leakage of the outcome", () => {
    const v = featureVector(dataset.labels[0])
    expect(v).toHaveLength(FEATURE_KEYS.length)
    expect(v.every(n => Number.isFinite(n))).toBe(true)
    // the ground-truth metric must NOT be one of the model features
    expect(FEATURE_KEYS).not.toContain("groundTruthValue")
    expect(FEATURE_KEYS).not.toContain("groundTruthClass")
  })
})
