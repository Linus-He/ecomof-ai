import { describe, expect, it } from "vitest"
import demoRecords from "../../../public/data/gas_adsorption_records_demo.json"
import v1Records from "../../../public/data/gas_adsorption_records_v1.json"
import fieldSources from "../../../public/data/gas_adsorption_field_sources_v1.json"
import schema from "../../../public/data/gas_adsorption_schema_v1.json"
import {
  GAS_FIELD_SOURCE_KEYS,
  GAS_RECORD_REQUIRED_FIELDS,
  GAS_SCHEMA_VERSION,
  validateGasAdsorptionRecords,
} from "../../components/gas/gasDataSchema"

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
  "validationRecommendation",
]

describe("gas adsorption demo records", () => {
  it("covers all required GasSep scenarios", () => {
    expect(demoRecords).toHaveLength(19)
    const counts = demoRecords.reduce((acc, record) => {
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
    for (const record of demoRecords) {
      for (const field of requiredFields) {
        expect(record, `${record.id} missing ${field}`).toHaveProperty(field)
      }
      expect(record.dataType).toMatch(/demo|simulated|predicted|experimental/i)
      expect(["A", "B", "C"]).toContain(record.evidenceLevel)
      expect(record.citation.toLowerCase()).toContain("demo")
      expect(Array.isArray(record.whyRecommended)).toBe(true)
      expect(Array.isArray(record.risks)).toBe(true)
      expect(record.validationRecommendation).toMatchObject({
        type: expect.any(String),
        typeZh: expect.any(String),
        priority: expect.any(String),
        reason: expect.any(String),
        reasonZh: expect.any(String),
        expectedOutput: expect.any(String),
        expectedOutputZh: expect.any(String),
        evidenceImpact: expect.any(String),
        evidenceImpactZh: expect.any(String),
      })
      expect(Array.isArray(record.validationRecommendation.requiredData)).toBe(true)
      expect(Array.isArray(record.validationRecommendation.requiredDataZh)).toBe(true)
    }
  })
})

describe("gas adsorption v1 records", () => {
  it("meets Gas Adsorption Data Layer v1 coverage requirements", () => {
    expect(v1Records.length).toBeGreaterThanOrEqual(40)
    const counts = v1Records.reduce((acc, record) => {
      acc[record.gasPair] = (acc[record.gasPair] || 0) + 1
      return acc
    }, {})
    expect(counts["CO2/N2"]).toBeGreaterThanOrEqual(10)
    expect(counts["CO2/CH4"]).toBeGreaterThanOrEqual(10)
    expect(counts["H2/CO2"]).toBeGreaterThanOrEqual(5)
    expect(counts["O2/N2"]).toBeGreaterThanOrEqual(5)
    expect(counts["VOC/N2"]).toBeGreaterThanOrEqual(5)
    const otherCount = v1Records.filter(record => !["CO2/N2", "CO2/CH4", "H2/CO2", "O2/N2", "VOC/N2"].includes(record.gasPair)).length
    expect(otherCount).toBeGreaterThanOrEqual(5)
  })

  it("keeps required record and field-level provenance fields", () => {
    expect(schema.schemaVersion).toBe(GAS_SCHEMA_VERSION)
    const validation = validateGasAdsorptionRecords(v1Records)
    expect(validation.errors).toEqual([])
    for (const record of v1Records) {
      for (const field of GAS_RECORD_REQUIRED_FIELDS) {
        expect(record, `${record.id} missing ${field}`).toHaveProperty(field)
      }
      expect(record.schemaVersion).toBe(GAS_SCHEMA_VERSION)
      expect(record.recordProvenance).toMatchObject({
        sourceDatabase: expect.any(String),
        sourceRecordId: expect.any(String),
        sourceVersion: expect.any(String),
        citation: expect.any(String),
        license: expect.any(String),
        retrievedAt: expect.any(String),
        curatedBy: expect.any(String),
        curationNote: expect.any(String),
      })
      expect(record.id in fieldSources).toBe(true)
      for (const key of GAS_FIELD_SOURCE_KEYS) {
        expect(record.fieldSources[key], `${record.id} missing field source ${key}`).toMatchObject({
          field: key,
          sourceType: expect.any(String),
          citation: expect.any(String),
          curationStatus: expect.any(String),
          confidence: expect.any(Number),
          note: expect.any(String),
        })
      }
    }
  })
})
