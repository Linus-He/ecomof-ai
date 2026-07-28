// @ts-nocheck
import { describe, expect, it } from "vitest"
import reaction from "../../../public/data/organic_acid_reaction_dataset_v3.json"

const REQUIRED = ["temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity"]

describe("Reaction Dataset expansion (V3.3)", () => {
  it("quarantines reaction rows derived from placeholder candidates", () => {
    expect(reaction.total).toBe(0)
    expect(reaction.records.length).toBe(reaction.total)
    expect(reaction.status).toBe("quarantined")
  })

  it("includes every required reaction condition + outcome field", () => {
    for (const r of reaction.records.slice(0, 50)) {
      for (const field of REQUIRED) expect(r[field]).not.toBeUndefined()
    }
  })

  it("is explicitly labelled as quarantined derived data (never experimental)", () => {
    expect(reaction.datasetOrigin).toBe("quarantined_derived_dataset")
    expect(reaction.excludedFromCurrentStatistics).toBe(true)
  })
})
