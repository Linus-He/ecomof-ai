// @ts-nocheck
import { describe, expect, it } from "vitest"
import { createScoringModel } from "../../scoring"

const candidates = [
  { id: "a", surfaceArea: 1000, poreVolume: 0.8, toxicityConcern: "low" },
  { id: "b", surfaceArea: 2000, poreVolume: 1.1, toxicityConcern: "medium" },
  { id: "c", surfaceArea: 3000, poreVolume: 1.6, toxicityConcern: "high" },
]

function makeModel(alpha, manualWeights) {
  return createScoringModel({
    candidates,
    descriptorKeys: ["surfaceArea", "poreVolume", "toxicityConcern"],
    algorithm: "hybrid",
    hybridAlpha: alpha,
    manualWeights,
  })
}

describe("Hybrid weighting robustness", () => {
  it("clamps alpha below zero", () => {
    const model = makeModel(-2, { surfaceArea: 2, poreVolume: 1 })
    expect(model.weightingDiagnostics.actualAlpha).toBe(0)
  })

  it("clamps alpha above one", () => {
    const model = makeModel(9, { surfaceArea: 2, poreVolume: 1 })
    expect(model.weightingDiagnostics.actualAlpha).toBe(1)
  })

  it("normalizes incomplete expert weights and keeps final sum at one", () => {
    const model = makeModel(0.25, { surfaceArea: 2 })
    const sum = Object.values(model.weights).reduce((total, value) => total + Number(value || 0), 0)
    expect(sum).toBeCloseTo(1, 6)
    expect(model.weightingDiagnostics.expertPriorUsed).toBe(true)
  })
})
