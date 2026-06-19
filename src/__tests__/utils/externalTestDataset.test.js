// @ts-nocheck
import { describe, expect, it } from "vitest"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import { buildExternalTestDataset, validateExternalTestRecord } from "../../utils/dataIngestion/externalTestDataset"

describe("External Test Dataset", () => {
  it("the committed external test set is ≥ 30 and disjoint from training", () => {
    const built = buildExternalTestDataset(externalData.records, { trainingRecords: labelData.labels })
    expect(built.records.length).toBeGreaterThanOrEqual(30)
    expect(built.summary.disjointFromTraining).toBe(true)
    expect(built.overlaps.length).toBe(0)
    for (const r of built.records) expect(r.split).toBe("external_test")
  })

  it("rejects a record that overlaps the training catalysts", () => {
    const overlapping = [{ recordId: "x1", candidateId: labelData.labels[0].candidateId, groundTruthClass: "promising", sourceType: "independent_experiment" }]
    const built = buildExternalTestDataset(overlapping, { trainingRecords: labelData.labels })
    expect(built.records.length).toBe(0)
    expect(built.overlaps.length).toBe(1)
    expect(built.overlaps[0].overlap).toContain("catalyst")
  })

  it("rejects a forbidden source type for an external record", () => {
    const check = validateExternalTestRecord({ recordId: "x", candidateId: "c", groundTruthClass: "promising", sourceType: "algorithm_generated" })
    expect(check.valid).toBe(false)
  })
})
