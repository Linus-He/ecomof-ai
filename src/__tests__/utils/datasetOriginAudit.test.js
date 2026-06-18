// @ts-nocheck
import { describe, expect, it } from "vitest"
import derivedAudit from "../../../public/data/data_ingestion/derived_dataset_audit_v1.json"
import { auditDatasetOrigin } from "../../utils/dataIngestion/datasetOriginAudit"

describe("Dataset Origin Audit (Derived Dataset Audit)", () => {
  it("separates real, derived, and synthetic data with no missing origin", () => {
    expect(derivedAudit.missingOrigin).toBe(0)
    expect(derivedAudit.status).toBe("Pass")
    expect(derivedAudit.externalDatabase).toBeGreaterThanOrEqual(2400)
    expect(derivedAudit.literature).toBeGreaterThanOrEqual(500)
    expect(derivedAudit.synthetic).toBe(0)
  })

  it("never counts derived or synthetic data as experimental", () => {
    expect(derivedAudit.experimental).toBe(0)
    expect(derivedAudit.derived).toBeGreaterThan(0)
  })

  it("counts each datasetOrigin category", () => {
    const audit = auditDatasetOrigin([
      { datasetOrigin: "external_database" },
      { datasetOrigin: "literature_curated" },
      { datasetOrigin: "derived_dataset" },
      { datasetOrigin: "experimental" },
      { datasetOrigin: "synthetic_fixture" },
    ])
    expect(audit.externalDatabase).toBe(1)
    expect(audit.literature).toBe(1)
    expect(audit.derived).toBe(1)
    expect(audit.experimental).toBe(1)
    expect(audit.synthetic).toBe(1)
  })

  it("flags records that have no datasetOrigin", () => {
    const audit = auditDatasetOrigin([{ mofId: "x" }])
    expect(audit.missingOrigin).toBe(1)
    expect(audit.status).toBe("Fail")
  })
})
