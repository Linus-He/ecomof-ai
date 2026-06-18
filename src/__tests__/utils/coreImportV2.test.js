// @ts-nocheck
import { describe, expect, it } from "vitest"
import coreImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import { importCoreMof, CORE_MOF_PROVENANCE } from "../../utils/dataIngestion/importCoreMofV2"

describe("CoRE MOF import (V2)", () => {
  it("ingests at least 1200 CoRE MOF records with real dataset provenance", () => {
    expect(coreImport.count).toBeGreaterThanOrEqual(1200)
    expect(coreImport.records.every(r => r.datasetOrigin === "external_database")).toBe(true)
    expect(coreImport.records.every(r => r.doi === CORE_MOF_PROVENANCE.doi)).toBe(true)
    expect(coreImport.records.every(r => r.sourceDatabase === "CoRE MOF")).toBe(true)
  })

  it("normalizes descriptors and attaches dataset origin + provenance on import", () => {
    const result = importCoreMof([
      { id: "X1", sourceRecordId: "core_x1", metalNode: "Zr", surfaceArea: 1200, poreVolume: 0.7, density: 1.1, voidFraction: 0.5 },
    ])
    const record = result.records[0]
    expect(record.datasetOrigin).toBe("external_database")
    expect(record.doi).toBe(CORE_MOF_PROVENANCE.doi)
    expect(record.surfaceArea).toBe(1200)
    expect(result.summary.provenanceCoverage).toBe(1)
    expect(record.valueBasis).toBe("database_distribution")
  })

  it("deduplicates by source record id", () => {
    const result = importCoreMof([
      { id: "A", sourceRecordId: "dup" },
      { id: "B", sourceRecordId: "dup" },
    ])
    expect(result.records).toHaveLength(1)
    expect(result.summary.duplicateCount).toBe(1)
  })
})
