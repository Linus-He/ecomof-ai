// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import { auditGoldDataset, AUDIT_SAMPLE_MODES } from "../../utils/dataAudit/goldDatasetAudit"

describe("Gold Dataset Audit", () => {
  it("supports 20 / 50 / 100 sampling modes deterministically", () => {
    expect(AUDIT_SAMPLE_MODES).toEqual([20, 50, 100])
    const a1 = auditGoldDataset(gold.records, { sampleSize: 50 })
    const a2 = auditGoldDataset(gold.records, { sampleSize: 50 })
    expect(a1.sampleSize).toBe(50)
    expect(a1.passCount).toBe(a2.passCount)
  })

  it("achieves a Gold audit pass rate >= 95% on the real Gold dataset", () => {
    const audit = auditGoldDataset(gold.records, { sampleSize: 100 })
    expect(audit.auditPassRate).toBeGreaterThanOrEqual(0.95)
    expect(audit.status).toBe("Pass")
    expect(audit.auditPassRate + audit.auditFailRate).toBeCloseTo(1, 5)
  })

  it("fails records that miss DOI, citation, yield, or selectivity", () => {
    const broken = [
      { recordId: "x", evidence: { doi: "pending", citation: "pending", sourceUrl: "pending" }, reaction: {}, performance: {}, provenanceCoverage: 0 },
    ]
    const audit = auditGoldDataset(broken, { sampleSize: 20 })
    expect(audit.passCount).toBe(0)
    expect(audit.criticalIssues[0].issues).toEqual(expect.arrayContaining(["doi", "citation", "yield", "selectivity"]))
  })
})
