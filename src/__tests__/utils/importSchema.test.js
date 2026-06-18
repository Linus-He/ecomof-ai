// @ts-nocheck
import { describe, expect, it } from "vitest"
import schema from "../../../public/data/data_ingestion/import_schema.json"

describe("V3.0 Unified Import Schema", () => {
  it("defines the five layers with required keys", () => {
    expect(schema.schemaVersion).toBe("v3.0")
    expect(Object.keys(schema.layers)).toEqual(["mof", "reaction", "performance", "evidence", "quality"])
    expect(schema.layers.mof.fields).toHaveProperty("mofId")
    expect(schema.layers.reaction.fields).toHaveProperty("reactionId")
    expect(schema.layers.performance.fields).toHaveProperty("yield")
    expect(schema.layers.evidence.fields).toHaveProperty("doi")
    expect(schema.layers.quality.fields).toHaveProperty("validationStatus")
  })

  it("declares the quality tiers and canonical units", () => {
    expect(schema.qualityTiers).toEqual(["Gold", "Silver", "Bronze", "Rejected"])
    expect(schema.layers.reaction.fields.temperature.unit).toBe("degC")
    expect(schema.layers.reaction.fields.pressure.unit).toBe("bar")
    expect(schema.layers.mof.fields.surfaceArea.unit).toBe("m^2/g")
    expect(schema.layers.mof.fields.poreSizeA.unit).toBe("angstrom")
    expect(schema.layers.performance.fields.yield.unit).toBe("percent")
  })

  it("forbids fabricated DOI/citation and synthetic fixtures in the Gold criteria", () => {
    expect(schema.goldCriteria.forbid).toContain("syntheticFixture")
    expect(schema.goldCriteria.forbid).toContain("fabricatedDoi")
    expect(schema.goldCriteria.criticalFields).toContain("doi")
    expect(schema.goldCriteria.criticalFields).toContain("citation")
  })
})
