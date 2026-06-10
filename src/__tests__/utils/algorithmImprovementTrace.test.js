// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildAlgorithmImprovementTrace } from "../../utils/databaseIndex/algorithmImprovementTrace"

const records = [
  { recordId: "A", sourceDatabase: "CoRE MOF", sourceRecordId: "A1", metalNode: "Cu", descriptors: { surfaceArea: 1200, poreSizeA: 8, pldA: 8, poreVolume: 0.7, density: 1.1, bandGap: 2.5, openMetalSiteProxy: 0.6, stabilityProxy: 0.7, hydrophilicityProxy: 0.5, lcdA: 12 }, metadataVerification: { descriptorProvenanceStatus: "complete" }, descriptorProvenance: { source: "database" }, notFinalRecommendation: true },
  { recordId: "B", sourceDatabase: "CoRE MOF", sourceRecordId: "B1", metalNode: "Al", descriptors: { surfaceArea: 900, poreSizeA: 6, pldA: 6, poreVolume: 0.5, density: 1.0, bandGap: 3.1, openMetalSiteProxy: 0.3, stabilityProxy: 0.6, hydrophilicityProxy: 0.55, lcdA: 9 }, metadataVerification: { descriptorProvenanceStatus: "partial" }, notFinalRecommendation: true },
]

describe("algorithmImprovementTrace", () => {
  it("includes all pipeline stages from raw records to preview output", () => {
    const trace = buildAlgorithmImprovementTrace(records)
    const ids = trace.stages.map(s => s.id)
    expect(ids).toEqual([
      "raw_records",
      "metadata_gate",
      "descriptor_completeness",
      "redundancy_gate",
      "mechanism_proxy",
      "sensitivity_audit",
      "preview_output",
    ])
    expect(trace.stages[0].inputCount).toBe(2)
  })

  it("never reports model accuracy metrics and stays not-final", () => {
    const trace = buildAlgorithmImprovementTrace(records)
    const serialized = JSON.stringify(trace)
    expect(serialized).not.toMatch(/\bR2\b|R\^2|R²|\bMAE\b|\bRMSE\b/i)
    expect(trace.notFinalRecommendation).toBe(true)
    expect(trace.boundary).toMatch(/does not represent a trained predictive model/i)
  })

  it("marks the sensitivity stage pending when no sensitivity data is given", () => {
    const trace = buildAlgorithmImprovementTrace(records)
    const sensitivity = trace.stages.find(s => s.id === "sensitivity_audit")
    expect(sensitivity.metrics.status).toBe("pending")
  })
})
