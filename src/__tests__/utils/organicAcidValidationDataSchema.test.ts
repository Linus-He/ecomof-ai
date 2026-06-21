// @ts-nocheck
import { describe, expect, it } from "vitest"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import experimentalLabels from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import benchmarkDataset from "../../../public/data/benchmark_dataset_v3_6.json"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import {
  ORGANIC_ACID_CONFIDENCE_LEVELS,
  ORGANIC_ACID_VALIDATION_EVIDENCE_TYPES,
  buildResearchValidationSummary,
} from "../../utils/organicAcidResearchValidation"

describe("Organic Acid validation data schema", () => {
  it("builds queue, matrix, and graph records with explanations, confidence source, fallback, and provenance", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords)
    const summary = buildResearchValidationSummary({
      result,
      evidenceRecords,
      labels: experimentalLabels,
      benchmarkDataset,
    })

    expect(summary.validationQueue.length).toBeGreaterThan(0)
    for (const row of summary.validationQueue) {
      expect(row).toEqual(expect.objectContaining({
        id: expect.any(String),
        candidate: expect.any(String),
        mof: expect.any(String),
        pathway: expect.any(String),
        targetProduct: expect.any(String),
        priorityScore: expect.any(Number),
        confidenceLevel: expect.any(String),
        scoreExplanation: expect.stringMatching(/Priority Score/),
        suggestedNextExperiment: expect.any(String),
        whyNow: expect.any(String),
      }))
      expect(row.keyRisks.length).toBeGreaterThan(0)
      expect(row.missingData.length).toBeGreaterThan(0)
      expect(row.source.sourceRecordId).toMatch(/^priority\./)
      expect(row.confidenceSource.sourceRecordId).toMatch(/^confidence\./)
      expect(row.sourceTrace.length).toBeGreaterThan(1)
      expect(ORGANIC_ACID_CONFIDENCE_LEVELS).toContain(row.confidenceLevel)
    }

    expect(summary.confidenceMatrix.length).toBeGreaterThan(0)
    for (const point of summary.confidenceMatrix) {
      expect(ORGANIC_ACID_VALIDATION_EVIDENCE_TYPES).toContain(point.evidenceType)
      expect(ORGANIC_ACID_CONFIDENCE_LEVELS).toContain(point.confidenceLevel)
      expect(point.source.sourceRecordId).toBeTruthy()
      expect(point.evidenceDetails.join(" ")).toMatch(/Target product|Evidence type|Confidence/)
      expect(point.lowConfidenceReasons.length).toBeGreaterThan(0)
    }

    expect(summary.knowledgeGraph.nodes.length).toBeGreaterThan(0)
    expect(summary.knowledgeGraph.edges.length).toBeGreaterThan(0)
    for (const node of summary.knowledgeGraph.nodes) {
      expect(node.explanation).toBeTruthy()
      expect(node.confidence).toBeTruthy()
      expect(node.source.sourceRecordId).toBeTruthy()
    }
    for (const edge of summary.knowledgeGraph.edges) {
      expect(["supports", "contradicts", "pending"]).toContain(edge.relationType)
      expect(edge.evidenceTier).toBeTruthy()
      expect(edge.source.sourceRecordId).toBeTruthy()
    }

    const fallback = buildResearchValidationSummary({
      result: { rankedFrameworks: [{ id: "UNKNOWN-CANDIDATE" }] },
      evidenceRecords: [],
      labels: { labels: [] },
      benchmarkDataset: { records: [] },
    })
    expect(fallback.validationQueue[0].missingData.join(" ")).toMatch(/same-condition experiment|post-reaction characterization/)
    expect(fallback.validationQueue[0].sourceTrace[0].sourceRecordId).toBe("UNKNOWN-CANDIDATE")
  })
})
