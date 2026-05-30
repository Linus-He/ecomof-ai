// @ts-nocheck
import { describe, expect, it } from "vitest"
import { createScoringModel } from "../../scoring"

const descriptors = ["surfaceArea", "poreVolume", "toxicityConcern"]

function weightSum(weights) {
  return Object.values(weights || {}).reduce((sum, value) => sum + Number(value || 0), 0)
}

describe("CRITIC weighting robustness", () => {
  it("falls back without crashing on empty candidates", () => {
    const model = createScoringModel({ candidates: [], descriptorKeys: descriptors, algorithm: "critic" })
    expect(model.rankings).toEqual([])
    expect(weightSum(model.weights)).toBeCloseTo(1, 6)
    expect(model.weightingDiagnostics.fallbackUsed).toBe(true)
  })

  it("falls back without crashing on a single candidate", () => {
    const model = createScoringModel({
      candidates: [{ id: "one", surfaceArea: "1200", poreVolume: 0.8, toxicityConcern: "low" }],
      descriptorKeys: descriptors,
      algorithm: "critic",
    })
    expect(model.rankings).toHaveLength(1)
    expect(weightSum(model.weights)).toBeCloseTo(1, 6)
    expect(model.weightingDiagnostics.reason).toBe("candidate-count-below-two")
  })

  it("drops all-missing descriptors and keeps finite normalized weights", () => {
    const model = createScoringModel({
      candidates: [
        { id: "a", surfaceArea: null, poreVolume: 0.5, toxicityConcern: "low" },
        { id: "b", surfaceArea: undefined, poreVolume: 1.2, toxicityConcern: "medium" },
        { id: "c", surfaceArea: "unknown", poreVolume: 1.8, toxicityConcern: "high" },
      ],
      descriptorKeys: descriptors,
      algorithm: "critic",
    })
    expect(model.weightingDiagnostics.droppedDescriptors).toContain("surfaceArea")
    expect(Object.values(model.weights).every(Number.isFinite)).toBe(true)
    expect(weightSum(model.weights)).toBeCloseTo(1, 6)
  })

  it("handles all-identical descriptors without NaN", () => {
    const model = createScoringModel({
      candidates: [
        { id: "a", surfaceArea: 1000, poreVolume: 1, toxicityConcern: "low" },
        { id: "b", surfaceArea: 1000, poreVolume: 1, toxicityConcern: "low" },
      ],
      descriptorKeys: descriptors,
      algorithm: "critic",
    })
    expect(Object.values(model.weights).every(Number.isFinite)).toBe(true)
    expect(weightSum(model.weights)).toBeCloseTo(1, 6)
  })

  it("reverses cost descriptors before scoring", () => {
    const model = createScoringModel({
      candidates: [
        { id: "low-risk", toxicityConcern: "low" },
        { id: "high-risk", toxicityConcern: "high" },
      ],
      descriptorKeys: ["toxicityConcern"],
      algorithm: "equal",
    })
    expect(model.rankings[0].id).toBe("low-risk")
  })
})
