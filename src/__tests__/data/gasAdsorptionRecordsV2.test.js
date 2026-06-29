import { describe, expect, it } from "vitest"
import records from "../../../public/data/gas_adsorption_records_v2.json"
import report from "../../../public/data/gas_adsorption_v2_collection_report.json"
import duplicateReport from "../../../public/data/gas_adsorption_duplicate_report_v2_1.json"
import iastReport from "../../../public/data/gas_adsorption_v2_1_iast_report.json"
import proxyReport from "../../../public/data/gas_structure_proxy_validation_report.json"
import registry from "../../../public/data/mof_identity_registry.json"
import identityReport from "../../../public/data/mof_identity_resolution_report.json"
import { validateGasAdsorptionRecords } from "../../components/gas/gasDataSchema"

describe("gas adsorption v2 records", () => {
  it("expands the gas layer with real-source records and explicit data grades", () => {
    expect(records.length).toBeGreaterThanOrEqual(300)
    expect(report.summary.provenanceComplete).toBe(true)
    expect(report.summary.nistRecordCount).toBeGreaterThanOrEqual(300)
    expect(report.summary.dataGradeCounts.experimental).toBeGreaterThan(0)
    expect(report.summary.dataGradeCounts.computed).toBeGreaterThan(0)
    expect(report.summary.dataGradeCounts["computed-IAST"]).toBeGreaterThan(43)
    expect(report.summary.dataGradeCounts.seed).toBeGreaterThan(0)
  })

  it("rejects fabricated records by requiring sourceUrl or DOI on every record and field provenance", () => {
    const validation = validateGasAdsorptionRecords(records)
    expect(validation.errors).toEqual([])
    for (const record of records) {
      expect(["experimental", "computed", "computed-IAST", "seed"]).toContain(record.dataGrade)
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
    expect(identityReport.summary.linkedGasRecordCount).toBeGreaterThan(0)
    expect(identityReport.summary.gasStructureResolutionRate).toBeGreaterThan(0)
    for (const row of identityReport.unresolved) {
      expect(row.reason).toMatch(/No structural CoRE\/QMOF record matched/)
    }
  })

  it("marks computed IAST selectivity with source isotherms and fit quality", () => {
    expect(iastReport.summary.computedIastCount).toBeGreaterThan(43)
    expect(iastReport.computed.length).toBe(iastReport.summary.computedIastCount)
    const computedRecords = records.filter(record => record.dataGrade === "computed-IAST")
    expect(computedRecords.length).toBe(iastReport.summary.computedIastCount)
    for (const record of computedRecords) {
      expect(record.metrics.iaSTSelectivity, record.id).toBeGreaterThan(0)
      expect(record.baseDataGrade, record.id).toMatch(/experimental|computed|seed|unknown/)
      expect(record.iast.sourceIsothermIds.primary, record.id).toBeTruthy()
      expect(record.iast.sourceIsothermIds.secondary, record.id).toBeTruthy()
      expect(record.iast.modelFits.primary.r2, record.id).toBeGreaterThanOrEqual(0)
      expect(record.iast.modelFits.secondary.r2, record.id).toBeGreaterThanOrEqual(0)
      expect(record.fieldSources.iaSTSelectivity.sourceType).toBe("iast_from_pure_component_isotherms")
      expect(record.fieldSources.iaSTSelectivity.sourceIsothermIds.primary).toBe(record.iast.sourceIsothermIds.primary)
      expect(record.evidence.dataType).toBe("simulated_iast")
      expect(record.evidence.hasMixtureValidation).toBe(false)
    }
  })

  it("publishes proxy validation and duplicate audit reports without hiding thin evidence", () => {
    expect(proxyReport.summary.realUptakeCount).toBeGreaterThan(0)
    expect(["low-validity-indicative", "indicative-only", "insufficient-data"]).toContain(proxyReport.summary.status)
    for (const metric of proxyReport.metrics) {
      expect(metric).toHaveProperty("n")
      expect(metric).toHaveProperty("status")
    }
    expect(duplicateReport.exactDuplicateCount).toBe(0)
    expect(duplicateReport.conditionRepeatGroupCount).toBeGreaterThanOrEqual(0)
  })
})
