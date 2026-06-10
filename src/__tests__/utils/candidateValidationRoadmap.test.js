// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildCandidateValidationRoadmap, buildValidationRoadmapForRecords } from "../../utils/databaseIndex/candidateValidationRoadmap"

const record = {
  recordId: "R1",
  displayName: "Candidate 1",
  sourceDatabase: "CoRE MOF",
  sourceRecordId: "COREMOF_000010",
  retrievedAt: "2026-06",
  metalNode: "Cu",
  descriptors: { surfaceArea: 1200, pldA: 9, poreVolume: 0.7, openMetalSiteProxy: 0.6, stabilityProxy: 0.7, hydrophilicityProxy: 0.5, lcdA: 12, bandGap: 2.4 },
  metadataVerification: { descriptorProvenanceStatus: "complete" },
}

describe("candidate validation roadmap", () => {
  it("produces metadata / descriptor / mechanism actions and validation directions", () => {
    const roadmap = buildCandidateValidationRoadmap(record)
    expect(roadmap.metadataActions.length).toBeGreaterThan(0)
    expect(roadmap.descriptorActions.length).toBeGreaterThan(0)
    expect(roadmap.suggestedValidation.length).toBeGreaterThan(0)
    expect(["high", "medium", "low"]).toContain(roadmap.validationPriority)
    expect(roadmap.notFinalRecommendation).toBe(true)
  })

  it("gives only validation directions, never concrete or hazardous recipes", () => {
    const roadmap = buildCandidateValidationRoadmap(record)
    // No concrete/hazardous experimental conditions in any action text.
    const actionText = [...roadmap.suggestedValidation, ...roadmap.mechanismActions, ...roadmap.descriptorActions]
      .map(action => `${action.en} ${action.zh}`)
      .join(" ")
      .toLowerCase()
    expect(actionText).not.toMatch(/\b\d+\s?(°c|deg c|mol\/l|molar|bar|psi|grams?)\b/)
    expect(actionText).not.toMatch(/protocol step|exact concentration/)
    expect(roadmap.boundary).toMatch(/not a recipe/i)
    roadmap.suggestedValidation.forEach(action => {
      expect(action.en).toBeTruthy()
      expect(action.zh).toBeTruthy()
    })
  })

  it("summarizes priorities across candidates", () => {
    const summary = buildValidationRoadmapForRecords([record, { recordId: "R2", descriptors: {} }], { topN: 2 })
    expect(summary.candidateCount).toBe(2)
    expect(summary.priorityCounts.high + summary.priorityCounts.medium + summary.priorityCounts.low).toBe(2)
    expect(summary.notFinalRecommendation).toBe(true)
  })
})
