// @ts-nocheck
import { describe, expect, it } from "vitest"
import { calculateEvidenceConfidence } from "../../utils/benchmark/calculateEvidenceConfidence"

describe("Evidence Confidence", () => {
  it("rates strong experimental evidence as High", () => {
    expect(calculateEvidenceConfidence({ experimental: 3 }).level).toBe("High")
    expect(calculateEvidenceConfidence({ experimental: 2, literature: 1 }).level).toBe("High")
  })

  it("rates moderate mixed evidence as Medium", () => {
    expect(calculateEvidenceConfidence({ literature: 2, expert: 1 }).level).toBe("Medium")
  })

  it("caps derived-only evidence at Low", () => {
    expect(calculateEvidenceConfidence({ derived: 50 }).level).toBe("Low")
  })

  it("weights experimental highest and derived lowest", () => {
    const exp = calculateEvidenceConfidence({ experimental: 1 }).weighted
    const der = calculateEvidenceConfidence({ derived: 1 }).weighted
    expect(exp).toBeGreaterThan(der)
  })
})
