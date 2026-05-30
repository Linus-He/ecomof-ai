// @ts-nocheck
import { describe, expect, it } from "vitest"
import { createScoringModel } from "../../scoring"

describe("candidate ranking missing descriptor policy", () => {
  it("penalizes low-completeness candidates instead of silently ignoring gaps", () => {
    const model = createScoringModel({
      candidates: [
        { id: "complete", surfaceArea: 3000, poreVolume: 1 },
        { id: "partial", surfaceArea: 3000, poreVolume: null },
      ],
      descriptorKeys: ["surfaceArea", "poreVolume"],
      algorithm: "manual",
      manualWeights: { surfaceArea: 1, poreVolume: 1 },
      missingValueStrategy: "penalize",
    })
    expect(model.rankings[0].id).toBe("complete")
    const partial = model.rankings.find(row => row.id === "partial")
    expect(partial.missingDescriptorPolicy.explanation).toContain("0.75 + 0.25")
    expect(partial.methodNote).toMatch(/Score adjusted by descriptor completeness/i)
  })
})
