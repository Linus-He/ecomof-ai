// @ts-nocheck
import { describe, expect, it } from "vitest"
import labels from "../../../public/data/organic_acid_labels_v2.json"

describe("organic acid label framework v2", () => {
  it("provides binary, multiclass, and regression labels without algorithm scores", () => {
    expect(labels.labelCount).toBeGreaterThanOrEqual(30)
    expect(labels.schema.binary).toEqual(["promising", "not_promising"])
    expect(labels.schema.multiclass).toEqual(["high", "medium", "low"])
    expect(labels.schema.regression).toEqual(["yield", "selectivity", "conversion"])
    for (const label of labels.labels.slice(0, 20)) {
      expect(label.binaryLabel).toMatch(/promising|not_promising/)
      expect(label.multiClassLabel).toMatch(/high|medium|low/)
      expect(label.regression.yield).toBeTypeOf("number")
      expect(label.labelSource).not.toMatch(/algorithm|score/i)
    }
  })
})
