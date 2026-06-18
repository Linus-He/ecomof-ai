// @ts-nocheck
import { describe, expect, it } from "vitest"
import { normalizeOrganicAcidRecord } from "../../utils/dataStandardization/normalizeOrganicAcidRecord"

describe("normalizeOrganicAcidRecord", () => {
  it("produces the unified five-layer structure", () => {
    const out = normalizeOrganicAcidRecord({
      id: "UiO-66", displayName: "UiO-66", metalNode: "Zr", reactionId: "r1", targetProduct: "formic acid",
      surfaceArea: 1200, reactionConditions: { temperature: { value: 170, unit: "C" }, solvent: "H2O" },
      productDistribution: { yield: 42 }, doi: "10.1021/x", citation: "Real et al.", sourceUrl: "http://x",
    }, { sourceId: "SRC-REAL-SEED" })
    expect(out.mof.mofId).toBe("UiO-66")
    expect(out.reaction.targetProduct).toBe("formic acid")
    expect(out.performance.yield).toBe(42)
    expect(out.evidence.doi).toBe("10.1021/x")
    expect(out.evidence.citation).toBe("Real et al.")
    expect(out.quality.provenanceCoverage).toBeGreaterThan(0.9)
  })

  it("keeps missing DOI/citation pending and never fabricates them", () => {
    const out = normalizeOrganicAcidRecord({ id: "X", displayName: "X", metalNode: "Al", reactionId: "r", targetProduct: "formic acid" }, { sourceId: "S" })
    expect(out.evidence.doi).toBe("pending")
    expect(out.evidence.citation).toBe("pending")
    expect(out.quality.provenanceCoverage).toBe(0)
  })

  it("propagates the synthetic fixture flag", () => {
    const out = normalizeOrganicAcidRecord({ id: "Y", displayName: "Y", metalNode: "Zr", reactionId: "r", targetProduct: "p", dataMode: "synthetic" }, { sourceId: "S" })
    expect(out.syntheticFixture).toBe(true)
  })
})
