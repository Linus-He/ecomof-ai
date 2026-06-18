// @ts-nocheck
import { describe, expect, it } from "vitest"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import { auditLabels } from "../../utils/dataAudit/labelAudit"

describe("Label Audit", () => {
  it("classifies the real label corpus by source and finds no algorithm-generated ground truth", () => {
    const audit = auditLabels(labels)
    expect(audit.total).toBeGreaterThan(0)
    expect(audit.invalidGroundTruthCount).toBe(0)
    expect(audit.labelSourceDistribution).toHaveProperty("dataset_derived")
    // V3.1 labels are dataset-derived, not independently measured experiments.
    expect(audit.datasetDerivedCount).toBeGreaterThan(0)
    expect(audit.realExperimentalLabelCount).toBe(0)
    expect(audit.status).toBe("Warning")
  })

  it("flags algorithm-generated labels as invalid ground truth", () => {
    const audit = auditLabels([
      { labelStatus: "available", binaryLabel: "promising", labelSource: "algorithmGeneratedScore" },
      { labelStatus: "available", binaryLabel: "promising", labelSource: "finalScore" },
    ])
    expect(audit.algorithmGeneratedCount).toBe(2)
    expect(audit.invalidGroundTruthCount).toBe(2)
    expect(audit.status).toBe("Fail")
  })

  it("recognizes real experimental labels", () => {
    const audit = auditLabels([{ labelStatus: "available", binaryLabel: "promising", labelSource: "experimental_measurement" }])
    expect(audit.realExperimentalLabelCount).toBe(1)
    expect(audit.status).toBe("Pass")
  })
})
