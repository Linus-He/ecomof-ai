// @ts-nocheck
import { describe, expect, it } from "vitest"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import { importQmof, QMOF_PROVENANCE } from "../../utils/dataIngestion/importQmofV2"

describe("QMOF import (V2)", () => {
  it("ingests at least 1200 QMOF records with real dataset provenance", () => {
    expect(qmofImport.count).toBeGreaterThanOrEqual(1200)
    expect(qmofImport.records.every(r => r.datasetOrigin === "external_database")).toBe(true)
    expect(qmofImport.records.every(r => r.doi === QMOF_PROVENANCE.doi)).toBe(true)
    expect(qmofImport.records.every(r => r.sourceDatabase === "QMOF")).toBe(true)
  })

  it("carries the QMOF electronic descriptor (band gap)", () => {
    const result = importQmof([{ id: "Q1", sourceRecordId: "qmof_q1", metalNode: "Cu", bandGap: 2.4, density: 1.0, surfaceArea: 900 }])
    expect(result.records[0].bandGap).toBe(2.4)
    expect(result.records[0].datasetOrigin).toBe("external_database")
    expect(result.summary.provenanceConfirmed).toBe(1)
  })
})
