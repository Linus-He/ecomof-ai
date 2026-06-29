import { describe, expect, it } from "vitest"
import records from "../../../public/data/gas_adsorption_records_v2.json"
import report from "../../../public/data/gas_adsorption_v2_collection_report.json"
import registry from "../../../public/data/mof_identity_registry.json"
import { validateGasAdsorptionRecords } from "../../components/gas/gasDataSchema"

describe("gas adsorption v2 records", () => {
  it("expands the gas layer with real-source records and explicit data grades", () => {
    expect(records.length).toBeGreaterThanOrEqual(300)
    expect(report.summary.provenanceComplete).toBe(true)
    expect(report.summary.nistRecordCount).toBeGreaterThanOrEqual(300)
    expect(report.summary.dataGradeCounts.experimental).toBeGreaterThan(0)
    expect(report.summary.dataGradeCounts.computed).toBeGreaterThan(0)
    expect(report.summary.dataGradeCounts.seed).toBeGreaterThan(0)
  })

  it("rejects fabricated records by requiring sourceUrl or DOI on every record and field provenance", () => {
    const validation = validateGasAdsorptionRecords(records)
    expect(validation.errors).toEqual([])
    for (const record of records) {
      expect(["experimental", "computed", "seed"]).toContain(record.dataGrade)
      expect(record.recordProvenance?.sourceUrl || record.recordProvenance?.doi, record.id).toBeTruthy()
      for (const [field, source] of Object.entries(record.fieldSources || {})) {
        expect(source, `${record.id}.${field}`).toMatchObject({
          field: expect.any(String),
          sourceType: expect.any(String),
          citation: expect.any(String),
          curationStatus: expect.any(String),
          note: expect.any(String),
        })
      }
    }
  })

  it("builds an identity registry without forcing unresolved gas names onto structure ids", () => {
    expect(registry.summary.canonicalCount).toBeGreaterThan(1000)
    expect(registry.summary.gasLinkedCount).toBeGreaterThan(0)
    expect(registry.summary.structuralLinkedCount).toBeGreaterThan(0)
    expect(Array.isArray(registry.unresolved)).toBe(true)
  })
})
