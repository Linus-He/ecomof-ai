// @ts-nocheck
import { describe, expect, it } from "vitest"
import { normalizeReactionRecord } from "../../utils/dataStandardization/normalizeReactionRecord"

describe("normalizeReactionRecord", () => {
  it("normalizes temperature (K -> degC) and pressure (atm -> bar)", () => {
    const out = normalizeReactionRecord({
      reactionId: "r1",
      targetProduct: "formic acid",
      reactionConditions: { temperature: { value: 443.15, unit: "K" }, pressure: { value: 2, unit: "atm" }, solvent: "H2O" },
    }, { sourceId: "S" })
    expect(out.temperature).toBeCloseTo(170, 1)
    expect(out.pressure).toBeCloseTo(2.0265, 3)
    expect(out.solvent).toBe("H2O")
    expect(out.fieldSources.temperature.normalizedUnit).toBe("degC")
    expect(out.fieldSources.pressure.normalizedUnit).toBe("bar")
  })

  it("normalizes reaction time (min -> h) and performance percentages", () => {
    const out = normalizeReactionRecord({
      reactionId: "r2",
      targetProduct: "formic acid",
      reactionConditions: { reactionTime: { value: 120, unit: "min" } },
      productDistribution: { yield: 0.42, selectivity: 88 },
    }, { sourceId: "S" })
    expect(out.reactionTime).toBe(2)
    expect(out.performance.yield).toBe(42)
    expect(out.performance.selectivity).toBe(88)
    expect(out.fieldSources.yield.normalizedUnit).toBe("percent")
    expect(out.fieldSources.reactionTime.normalizationMethod).toBe("min->h")
  })
})
