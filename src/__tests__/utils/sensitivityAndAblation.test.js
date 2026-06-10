// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildSensitivityAuditSummary, runWeightPerturbationAudit } from "../../utils/databaseIndex/sensitivityAudit"
import { buildFeatureAblationAudit } from "../../utils/databaseIndex/featureAblationAudit"

const records = Array.from({ length: 16 }, (_, i) => ({
  recordId: `R${i}`,
  displayName: `Candidate ${i}`,
  sourceDatabase: "CoRE MOF",
  metalNode: i % 2 ? "Cu" : "Al",
  descriptors: {
    surfaceArea: 600 + i * 55,
    poreVolume: 0.4 + i * 0.03,
    voidFraction: 0.3 + i * 0.02,
    pldA: 5 + (i % 7),
    lcdA: 9 + (i % 9),
    bandGap: 2 + (i % 4) * 0.4,
    openMetalSiteProxy: 0.3 + (i % 5) * 0.1,
    stabilityProxy: 0.5 + (i % 3) * 0.12,
    hydrophilicityProxy: 0.45 + (i % 4) * 0.05,
  },
  metadataVerification: { descriptorProvenanceStatus: i % 3 === 0 ? "complete" : "partial" },
  retrievedAt: "2026-06",
}))

describe("sensitivity audit", () => {
  it("is deterministic and reports stability in 0-1 without accuracy metrics", () => {
    const a = buildSensitivityAuditSummary(records)
    const b = buildSensitivityAuditSummary(records)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a.top5Stability).toBeGreaterThanOrEqual(0)
    expect(a.top5Stability).toBeLessThanOrEqual(1)
    expect(a.top10Stability).toBeGreaterThanOrEqual(0)
    expect(a.top10Stability).toBeLessThanOrEqual(1)
    expect(a.notFinalRecommendation).toBe(true)
    expect(JSON.stringify(a)).not.toMatch(/R\^2|R²|\bMAE\b|\bRMSE\b|accuracy/i)
  })

  it("identifies unstable candidates as an array", () => {
    const audit = runWeightPerturbationAudit(records, { perturbationRange: 0.4 })
    expect(Array.isArray(audit.unstableCandidates)).toBe(true)
  })
})

describe("feature ablation audit", () => {
  it("includes the four required variants and Top-N overlap without deleting descriptors", () => {
    const audit = buildFeatureAblationAudit(records)
    const ids = audit.variants.map(v => v.id)
    expect(ids).toEqual(["all_descriptors", "without_redundant_descriptors", "without_mechanism_proxies", "metadata_gate_only"])
    audit.variants.forEach(v => {
      expect(v.topNOverlapWithBaseline).toBeGreaterThanOrEqual(0)
      expect(v.topNOverlapWithBaseline).toBeLessThanOrEqual(1)
    })
    // Source records are untouched.
    expect(records[0].descriptors.surfaceArea).toBe(600)
    expect(audit.boundary).toMatch(/No descriptor field is deleted/i)
    expect(audit.notFinalRecommendation).toBe(true)
  })
})
