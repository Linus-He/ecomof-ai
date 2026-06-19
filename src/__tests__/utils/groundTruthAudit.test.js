// @ts-nocheck
import { describe, expect, it } from "vitest"
import dataset from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import { auditGroundTruth } from "../../utils/dataAudit/groundTruthAudit"

describe("Ground Truth Audit", () => {
  it("verifies the real experimental labels and finds no invalid ground truth", () => {
    const audit = auditGroundTruth(dataset.labels)
    expect(audit.verifiedGroundTruthCount).toBeGreaterThanOrEqual(30)
    expect(audit.invalidGroundTruthCount).toBe(0)
    expect(audit.status).toBe("Pass")
  })

  it("rejects an algorithm-generated label as ground truth (derived label cannot enter ground truth)", () => {
    const audit = auditGroundTruth([
      { labelId: "ok", sourceType: "expert_review", groundTruthClass: "promising" },
      { labelId: "bad", sourceType: "algorithm_generated", groundTruthClass: "promising" },
      { labelId: "bad2", sourceType: "derived_dataset", groundTruthClass: "not_promising" },
    ])
    expect(audit.verifiedGroundTruthCount).toBe(1)
    expect(audit.invalidGroundTruthCount).toBe(2)
    expect(audit.status).toBe("Warning")
  })

  it("rejects a label with no ground-truth value/class", () => {
    const audit = auditGroundTruth([{ labelId: "empty", sourceType: "expert_review" }])
    expect(audit.invalidGroundTruthCount).toBe(1)
  })
})
