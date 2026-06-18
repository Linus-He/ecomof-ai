// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import { auditProvenance } from "../../utils/dataAudit/provenanceAudit"

describe("Provenance Audit", () => {
  it("reports a high provenance coverage score on the real Gold dataset", () => {
    const audit = auditProvenance(gold.records)
    expect(audit.provenanceCoverageScore).toBeGreaterThanOrEqual(0.9)
    expect(audit.doiCoverage).toBeGreaterThan(0.9)
    expect(audit.citationCoverage).toBeGreaterThan(0.9)
    expect(audit.status).toBe("Pass")
  })

  it("drops the score when DOI/citation are pending", () => {
    const audit = auditProvenance([
      { evidence: { doi: "pending", citation: "pending", sourceUrl: "pending" }, provenanceCoverage: 0 },
    ])
    expect(audit.provenanceCoverageScore).toBeLessThan(0.5)
    expect(audit.status).toBe("Fail")
  })
})
