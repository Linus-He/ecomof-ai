// @ts-nocheck
import { describe, expect, it } from "vitest"
import { bootstrapValidation, bootstrapSweep } from "../../utils/benchmark/bootstrapValidation"

// A separable-ish prediction set so metrics are well-defined.
const yTrue = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 1 : 0))
const yScore = yTrue.map((y, i) => (y === 1 ? 0.6 + (i % 5) * 0.05 : 0.4 - (i % 5) * 0.05))

describe("Bootstrap Validation", () => {
  it("produces a metric distribution of the requested size", () => {
    const b = bootstrapValidation({ yTrue, yScore, iterations: 500 })
    expect(b.iterations).toBe(500)
    expect(b.distributions.accuracy.length).toBe(500)
    expect(b.summary.accuracy.ci95.lower).toBeLessThanOrEqual(b.summary.accuracy.mean)
    expect(b.summary.accuracy.ci95.upper).toBeGreaterThanOrEqual(b.summary.accuracy.mean)
  })

  it("runs the 100 / 500 / 1000 sweep", () => {
    const sweep = bootstrapSweep({ yTrue, yScore })
    expect(sweep["100"].iterations).toBe(100)
    expect(sweep["500"].iterations).toBe(500)
    expect(sweep["1000"].iterations).toBe(1000)
    expect(sweep["1000"].distributions.accuracy.length).toBe(1000)
  })

  it("is deterministic for a fixed seed", () => {
    const a = bootstrapValidation({ yTrue, yScore, iterations: 200, seed: 7 })
    const b = bootstrapValidation({ yTrue, yScore, iterations: 200, seed: 7 })
    expect(a.summary.accuracy.mean).toBe(b.summary.accuracy.mean)
  })
})
