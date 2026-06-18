// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"

describe("organic acid Gold dataset v2", () => {
  it("meets V3.1 Gold growth target with reaction-layer Gold criteria", () => {
    expect(gold.goldCount).toBeGreaterThanOrEqual(100)
    expect(gold.sufficient).toBe(true)
    for (const record of gold.records.slice(0, 10)) {
      expect(record.goldCriteria).toEqual(expect.arrayContaining(["DOI", "Citation", "Reaction Conditions", "Catalyst Info", "Performance Info", "Field Provenance"]))
      expect(record.reaction.temperature).toBeTypeOf("number")
      expect(record.performance.yield).toBeTypeOf("number")
      expect(record.evidence.doi).toMatch(/^10\./)
    }
  })
})
