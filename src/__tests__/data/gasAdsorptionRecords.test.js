import { describe, expect, it } from "vitest"
import records from "../../../public/data/gas_adsorption_records_demo.json"

const requiredFields = [
  "id",
  "mofId",
  "displayName",
  "rawName",
  "sourceDatabase",
  "sourceRecordId",
  "sourceVersion",
  "sourceUrl",
  "citation",
  "license",
  "retrievedAt",
  "curationStatus",
  "gasPair",
  "applicationScenario",
  "temperatureK",
  "pressureBar",
  "mixtureRatio",
  "primaryGas",
  "secondaryGas",
  "primaryUptake",
  "secondaryUptake",
  "uptakeUnit",
  "selectivity",
  "workingCapacity",
  "regenerability",
  "heatOfAdsorption",
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "density",
  "voidFraction",
  "metalNode",
  "linker",
  "topology",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
  "dataType",
  "evidenceLevel",
  "confidence",
  "score",
  "scoreBreakdown",
  "whyRecommended",
  "risks",
  "applicabilityNote",
  "limitationNote",
]

describe("gas adsorption demo records", () => {
  it("covers all required GasSep scenarios", () => {
    expect(records).toHaveLength(19)
    const counts = records.reduce((acc, record) => {
      acc[record.gasPair] = (acc[record.gasPair] || 0) + 1
      return acc
    }, {})
    expect(counts["CO2/N2"]).toBeGreaterThanOrEqual(5)
    expect(counts["CO2/CH4"]).toBeGreaterThanOrEqual(5)
    expect(counts["H2/CO2"]).toBeGreaterThanOrEqual(3)
    expect(counts["O2/N2"]).toBeGreaterThanOrEqual(3)
    expect(counts["VOC/N2"]).toBeGreaterThanOrEqual(3)
  })

  it("keeps required provenance, scoring, and evidence fields on every record", () => {
    for (const record of records) {
      for (const field of requiredFields) {
        expect(record, `${record.id} missing ${field}`).toHaveProperty(field)
      }
      expect(record.dataType).toMatch(/demo|simulated|predicted|experimental/i)
      expect(["A", "B", "C"]).toContain(record.evidenceLevel)
      expect(record.citation.toLowerCase()).toContain("demo")
      expect(Array.isArray(record.whyRecommended)).toBe(true)
      expect(Array.isArray(record.risks)).toBe(true)
    }
  })
})

