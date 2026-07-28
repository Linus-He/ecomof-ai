// @ts-nocheck
import { describe, expect, it } from "vitest"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import { importQmof, QMOF_PROVENANCE } from "../../utils/dataIngestion/importQmofV2"

describe("QMOF import (V2)", () => {
  it("quarantines the legacy placeholder QMOF rows from live calculation", () => {
    expect(qmofImport.count).toBe(0)
    expect(qmofImport.records).toEqual([])
    expect(qmofImport.summary.status).toBe("quarantined")
    expect(qmofImport.summary.reason).toMatch(/placeholders/i)
  })

  it("carries the QMOF electronic descriptor (band gap)", () => {
    const result = importQmof([{ id: "Q1", sourceRecordId: "qmof_q1", metalNode: "Cu", bandGap: 2.4, density: 1.0, surfaceArea: 900 }])
    expect(result.records[0].bandGap).toBe(2.4)
    expect(result.records[0].datasetOrigin).toBe("external_database")
    expect(result.summary.provenanceConfirmed).toBe(1)
  })
})
