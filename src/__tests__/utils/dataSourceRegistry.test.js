// @ts-nocheck
import { describe, expect, it } from "vitest"
import registry from "../../../public/data/data_ingestion/source_registry.json"

const UNCERTAINTY = ["pending", "unknown", "ambiguous", "restricted"]
const SOURCE_TYPES = ["MOF Database", "Computed Property Database", "Literature Dataset", "Manual Curation", "Expert Review", "Synthetic Fixture"]
const REQUIRED = ["sourceId", "sourceName", "sourceType", "sourceUrl", "citation", "license", "retrievedAt", "accessMethod", "uncertainty", "notes"]

describe("V3.0 Data Source Registry", () => {
  it("declares the registry, uncertainty vocabulary, and source types", () => {
    expect(registry.schemaVersion).toBe("v3.0")
    expect(registry.uncertaintyVocabulary).toEqual(UNCERTAINTY)
    expect(registry.sourceTypes).toEqual(SOURCE_TYPES)
    expect(Array.isArray(registry.sources)).toBe(true)
    expect(registry.sources.length).toBeGreaterThanOrEqual(6)
  })

  it("requires the registry fields on every source and a valid source type", () => {
    for (const source of registry.sources) {
      for (const field of REQUIRED) expect(source).toHaveProperty(field)
      expect(SOURCE_TYPES).toContain(source.sourceType)
      expect(typeof source.sourceId).toBe("string")
    }
  })

  it("uses the controlled uncertainty vocabulary (never fabricates confidence)", () => {
    for (const source of registry.sources) {
      expect(UNCERTAINTY).toContain(source.uncertainty)
    }
  })

  it("flags the synthetic fixture source as restricted and never Gold-eligible", () => {
    const synthetic = registry.sources.find(s => s.sourceType === "Synthetic Fixture")
    expect(synthetic).toBeTruthy()
    expect(synthetic.uncertainty).toBe("restricted")
    expect(synthetic.notes).toMatch(/never eligible for the Gold tier/i)
  })
})
