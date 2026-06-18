// @ts-nocheck
import { describe, expect, it } from "vitest"
import { calculateReactionComparability } from "../../utils/reaction/calculateReactionComparability"

describe("calculateReactionComparability", () => {
  it("marks same-product same-condition rows comparable", () => {
    const result = calculateReactionComparability({
      reactionId: "r-1",
      product: "formic acid",
      temperature: 172,
      pressure: 31,
      solvent: "water",
      reactionTime: 12,
    })
    expect(result.status).toBe("Comparable")
    expect(result.score).toBeGreaterThan(0.9)
  })

  it("keeps missing-condition rows out of direct comparison", () => {
    const result = calculateReactionComparability({ product: "methanol", solvent: "dmf" })
    expect(result.status).toBe("Not Comparable")
    expect(result.missing).toEqual(expect.arrayContaining(["Temperature", "Pressure", "Time"]))
  })
})
