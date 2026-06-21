// @ts-nocheck
import { describe, expect, it } from "vitest"
import externalV2 from "../../../public/data/external_test_dataset_v2.json"
import labelsV2 from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import { buildExternalTestDataset } from "../../utils/dataIngestion/externalTestDataset"

describe("External Test Expansion", () => {
  it("expands the external test set to >= 60", () => {
    expect(externalV2.records.length).toBeGreaterThanOrEqual(60)
  })

  it("stays disjoint from the expanded training labels (catalyst / experiment / DOI)", () => {
    const built = buildExternalTestDataset(externalV2.records, { trainingRecords: labelsV2.labels })
    expect(built.summary.disjointFromTraining).toBe(true)
    expect(built.overlaps.length).toBe(0)
    expect(built.records.length).toBe(externalV2.records.length)
  })

  it("every external record is held out (split = external_test)", () => {
    for (const r of externalV2.records) expect(r.split).toBe("external_test")
  })
})
