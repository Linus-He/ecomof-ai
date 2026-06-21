// @ts-nocheck
import { describe, expect, it } from "vitest"
import experimentalLabels from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import { buildValidationPriorityQueue } from "../../utils/organicAcidResearchValidation"

function resultWithCandidates(count = 12) {
  return {
    rankedFrameworks: Array.from({ length: count }, (_, index) => {
      const score = 0.95 - index * 0.04
      return {
        id: `UiO-67-Bi-T${String(index + 1).padStart(2, "0")}`,
        displayName: `Candidate ${index + 1}`,
        rank: index + 1,
        hydrothermalGate: { status: index < 8 ? "pass" : "needs_review" },
        organicAcidScore: { oacs: score },
      }
    }),
  }
}

describe("validationPriorityQueue", () => {
  it("computes a sorted Top 10 queue with field-level provenance", () => {
    const rows = buildValidationPriorityQueue({ result: resultWithCandidates(), labels: experimentalLabels })

    expect(rows).toHaveLength(10)
    expect(rows[0].priorityScore).toBeGreaterThanOrEqual(rows[1].priorityScore)
    expect(rows[0].name).toBe("Candidate 1")
    for (const row of rows) {
      expect(row.priorityScore).toBeGreaterThanOrEqual(0)
      expect(row.priorityScore).toBeLessThanOrEqual(100)
      expect(row.source.sourceDatabase).toBe("Organic Acid validation priority queue")
      expect(row.source.sourceRecordId).toMatch(/^priority\./)
      expect(row.source.sourceUrl).toMatch(/experimental_labels_v2\.json/)
      expect(row.source.evidenceTier).toBeTruthy()
    }
  })
})
