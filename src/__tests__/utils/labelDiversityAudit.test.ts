// @ts-nocheck
import { describe, expect, it } from "vitest"
import experimentalLabels from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import benchmarkDataset from "../../../public/data/benchmark_dataset_v3_6.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import { buildLabelDiversityAudit } from "../../utils/organicAcidResearchValidation"

describe("labelDiversityAudit", () => {
  it("counts DOI, paper, catalyst, and experiment diversity with field-level provenance", () => {
    const audit = buildLabelDiversityAudit({ labels: experimentalLabels, benchmarkDataset, evidenceRecords })

    expect(audit.totalRecords).toBe(150)
    expect(audit.uniquePapers).toBeGreaterThan(0)
    expect(audit.uniqueCatalysts).toBeGreaterThan(0)
    expect(audit.uniqueExperiments).toBe(150)
    expect(audit.score).toBeGreaterThanOrEqual(0)
    expect(audit.score).toBeLessThanOrEqual(100)
    expect(["Excellent", "Good", "Moderate", "Weak"]).toContain(audit.grade)

    for (const metric of audit.metrics) {
      expect(metric.source.sourceDatabase).toBeTruthy()
      expect(metric.source.sourceRecordId).toBeTruthy()
      expect(metric.source.sourceUrl).toBeTruthy()
      expect(metric.source).toHaveProperty("sourceDoi")
      expect(metric.source.evidenceTier).toBeTruthy()
    }
  })
})
