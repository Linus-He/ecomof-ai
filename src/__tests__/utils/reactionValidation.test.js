// @ts-nocheck
import { describe, expect, it } from "vitest"
import { validateReactionRecord } from "../../utils/reaction/validateReactionRecord"

const completeRecord = {
  reactionId: "r-1",
  product: "formic acid",
  temperature: 170,
  pressure: 30,
  solvent: "water",
  reactionTime: 12,
  yield: 48,
  selectivity: 72,
  conversion: 64,
  doi: "10.0000/reaction",
  citation: "Reaction citation",
  fieldSources: Object.fromEntries(["temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity", "conversion", "doi", "citation"].map(field => [field, { sourceRecordId: "s1", citation: "Reaction citation" }])),
}

describe("validateReactionRecord", () => {
  it("promotes complete sourced reaction records to Gold", () => {
    const result = validateReactionRecord(completeRecord)
    expect(result.tier).toBe("Gold")
    expect(result.blockers).toHaveLength(0)
    expect(result.sourceCoverage).toBeGreaterThan(0.8)
  })

  it("rejects missing DOI/citation or synthetic fixtures", () => {
    expect(validateReactionRecord({ ...completeRecord, doi: "pending" }).tier).toBe("Rejected")
    expect(validateReactionRecord({ ...completeRecord, syntheticFixture: true }).blockers.join(" ")).toMatch(/Synthetic Fixture/)
  })
})
