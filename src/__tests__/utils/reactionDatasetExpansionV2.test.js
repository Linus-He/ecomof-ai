// @ts-nocheck
import { describe, expect, it } from "vitest"
import reaction from "../../../public/data/organic_acid_reaction_dataset_v3.json"

const REQUIRED = ["temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity"]

describe("Reaction Dataset expansion (V3.3)", () => {
  it("expands the reaction dataset to at least 500 records", () => {
    expect(reaction.total).toBeGreaterThanOrEqual(500)
    expect(reaction.records.length).toBe(reaction.total)
  })

  it("includes every required reaction condition + outcome field", () => {
    for (const r of reaction.records.slice(0, 50)) {
      for (const field of REQUIRED) expect(r[field]).not.toBeUndefined()
    }
  })

  it("is labelled as a derived dataset (never experimental)", () => {
    expect(reaction.datasetOrigin).toBe("derived_dataset")
    expect(reaction.records.every(r => r.datasetOrigin === "derived_dataset")).toBe(true)
  })
})
