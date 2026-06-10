// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildDescriptorRedundancySummary,
  computePearsonCorrelation,
  detectLowVarianceDescriptors,
  detectRedundantDescriptorPairs,
  getNumericDescriptorMatrix,
} from "../../utils/databaseIndex/descriptorRedundancyGate"

function makeRecords(n, fn) {
  return Array.from({ length: n }, (_, i) => ({ descriptors: fn(i) }))
}

describe("descriptorRedundancyGate", () => {
  it("computes Pearson correlation and flags |r| > 0.7 as a redundant pair", () => {
    // poreSizeA and pldA are identical -> r = 1.
    const records = makeRecords(10, i => ({ poreSizeA: 4 + i, pldA: 4 + i, surfaceArea: 1000 + (i % 3) * 13 }))
    const matrix = getNumericDescriptorMatrix(records, ["poreSizeA", "pldA", "surfaceArea"])
    expect(computePearsonCorrelation(matrix.poreSizeA, matrix.pldA)).toBe(1)
    const pairs = detectRedundantDescriptorPairs(matrix, 0.7)
    expect(pairs.some(p => p.descriptorA === "poreSizeA" && p.descriptorB === "pldA")).toBe(true)
  })

  it("marks descriptors with fewer than 5 valid samples as insufficient data", () => {
    const records = makeRecords(8, i => ({ surfaceArea: 100 + i, bandGap: i < 3 ? 2 + i : null }))
    const summary = buildDescriptorRedundancySummary(records, ["surfaceArea", "bandGap"])
    const bandGap = summary.descriptors.find(d => d.descriptorKey === "bandGap")
    expect(bandGap.insufficientData).toBe(true)
    expect(bandGap.action).toBe("review")
  })

  it("marks low-variance descriptors as low information without deleting them", () => {
    const records = makeRecords(10, i => ({ density: 1.2, surfaceArea: 500 + i * 40 }))
    const lowVar = detectLowVarianceDescriptors(getNumericDescriptorMatrix(records, ["density", "surfaceArea"]), 1e-6)
    expect(lowVar).toContain("density")
    const summary = buildDescriptorRedundancySummary(records, ["density", "surfaceArea"])
    const density = summary.descriptors.find(d => d.descriptorKey === "density")
    expect(density.lowInformation).toBe(true)
    // Never delete: the descriptor is still present in the output.
    expect(summary.descriptors.map(d => d.descriptorKey)).toContain("density")
  })

  it("only emits keep / penalize / review actions and never deletes", () => {
    const records = makeRecords(12, i => ({ poreSizeA: 4 + i, pldA: 4 + i, surfaceArea: 800 + i * 25, density: 1.1 }))
    const summary = buildDescriptorRedundancySummary(records, ["poreSizeA", "pldA", "surfaceArea", "density"])
    expect(summary.descriptors.every(d => ["keep", "penalize", "review"].includes(d.action))).toBe(true)
    expect(summary.notFinalRecommendation).toBe(true)
    expect(summary.boundary).toMatch(/does not delete/i)
  })

  it("does not crash on records missing the descriptors object", () => {
    expect(() => buildDescriptorRedundancySummary([{}, { descriptors: {} }], ["surfaceArea"])).not.toThrow()
  })
})
