// @ts-nocheck
import { describe, expect, it } from "vitest"
import coreImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import qualityReport from "../../../public/data/core_mof_2024/quality_report.json"
import { importCoreMof, CORE_MOF_PROVENANCE } from "../../utils/dataIngestion/importCoreMofV2"

describe("CoRE MOF 2024 CSD-modified import", () => {
  it("ingests the 9,835 computation-ready source records at row-level grain", () => {
    expect(coreImport.count).toBe(9835)
    expect(coreImport.records.every(r => r.datasetOrigin === "external_database")).toBe(true)
    expect(coreImport.records.every(r => r.doi && r.sourceRecordId && r.csdRefcode)).toBe(true)
    expect(coreImport.records.every(r => r.sourceDatabase === "CoRE MOF 2024 · CSD-modified")).toBe(true)
    expect(new Set(coreImport.records.map(r => r.sourceRecordId)).size).toBe(9835)
    expect(coreImport.records.some(r => r.displayName === "UiO-66" && r.csdRefcode.startsWith("RUBTAK"))).toBe(true)
    expect(coreImport.records.some(r => /^CoRE-MOF-\d+$/i.test(r.displayName))).toBe(false)
    expect(qualityReport.status).toBe("passed")
    expect(qualityReport.checks.cifMissing).toBe(0)
  })

  it("quarantines the old RNG-generated QMOF placeholder import", () => {
    expect(qmofImport.count).toBe(0)
    expect(qmofImport.records).toEqual([])
    expect(qmofImport.summary.status).toBe("quarantined")
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
