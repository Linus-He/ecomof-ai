// @ts-nocheck
import { describe, expect, it } from "vitest"
import dataset from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import { auditExperimentalLabels } from "../../utils/dataAudit/experimentalLabelAudit"

describe("Experimental Label Audit", () => {
  it("counts the real corpus by source and enforces synthetic = 0", () => {
    const audit = auditExperimentalLabels(dataset.labels)
    expect(audit.experimentalLabelCount).toBeGreaterThanOrEqual(30)
    expect(audit.syntheticLabelCount).toBe(0)
    expect(audit.derivedLabelCount).toBe(0)
    expect(audit.status).toBe("Pass")
    // expert review + independent validation make up the experimental corpus
    expect(audit.expertReviewLabelCount + audit.independentValidationCount + audit.literatureLabelCount).toBe(audit.experimentalLabelCount)
  })

  it("fails when a synthetic label is present", () => {
    const audit = auditExperimentalLabels([
      ...dataset.labels,
      { labelId: "syn", sourceType: "synthetic_fixture", syntheticFixture: true, groundTruthClass: "promising" },
    ])
    expect(audit.syntheticLabelCount).toBe(1)
    expect(audit.status).toBe("Fail")
  })

  it("fails when a derived/algorithm label is present in the experimental layer", () => {
    const audit = auditExperimentalLabels([
      { labelId: "d", sourceType: "algorithm_generated", groundTruthClass: "promising" },
    ])
    expect(audit.derivedLabelCount).toBe(1)
    expect(audit.status).toBe("Fail")
  })
})
