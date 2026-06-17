// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"
import { explainCandidateRanking } from "../../utils/screeningTrace/explainCandidateRanking"
import { buildCandidateComparison } from "../../utils/screeningTrace/buildCandidateComparison"
import { buildReadinessMatrix } from "../../utils/screeningTrace/buildReadinessMatrix"

const weights = [
  { key: "d_stab", label: "Stability", weight: 0.4 },
  { key: "d_barrier", label: "Barrier", weight: 0.35 },
  { key: "d_select", label: "Selectivity", weight: 0.25 },
]
const candidates = [
  { id: "A", name: "A", G: 1, rank: 1, D_expected: 0.82, evidenceLevel: "B", descriptorCompleteness: { ratio: 0.9 }, scoreInputs: { d_stab: { normalized: 0.9 }, d_barrier: { normalized: 0.8 }, d_select: { normalized: 0.7 } } },
  { id: "B", name: "B", G: 1, rank: 2, D_expected: 0.55, evidenceLevel: "C", descriptorCompleteness: { ratio: 0.6 }, scoreInputs: { d_stab: { normalized: 0.6 }, d_barrier: { missing: true }, d_select: { normalized: 0.5 } }, dataGaps: ["Need DFT barrier"] },
  { id: "C", name: "C", G: 0, rank: null, D_expected: 0, evidenceLevel: "D", descriptorCompleteness: { ratio: 0.2 }, scoreInputs: {} },
]
const model = { candidates, weights }

describe("screeningTrace", () => {
  it("builds a trace where verifiedMetadataCount=0 is not verified screening", () => {
    const trace = buildScreeningTrace({ model, verification: { sourceConfirmedCount: 4, verifiedMetadataCount: 0 } })
    expect(trace.isVerifiedScreening).toBe(false)
    expect(trace.verifiedMetadataCount).toBe(0)
    expect(trace.sourceConfirmedCount).toBe(4)
    expect(trace.mode).toBe("database_preview")
    expect(trace.notFinalRecommendation).toBe(true)
    expect(trace.steps.length).toBe(10)
    expect(trace.steps.map(step => step.stepId)).toContain("performance_priority_applied")
  })

  it("keeps funnel counts non-increasing and consistent", () => {
    const trace = buildScreeningTrace({ model, verification: { sourceConfirmedCount: 1, verifiedMetadataCount: 0 } })
    for (const stage of trace.funnel) {
      expect(stage.removedCount).toBe(Math.max(0, stage.inputCount - stage.outputCount))
    }
    // raw input equals total candidates
    expect(trace.funnel[0].inputCount).toBe(candidates.length)
  })

  it("marks verified screening when at least one verified candidate exists", () => {
    const trace = buildScreeningTrace({ model, verification: { sourceConfirmedCount: 4, verifiedMetadataCount: 1 } })
    expect(trace.isVerifiedScreening).toBe(true)
    expect(trace.nextActions[0].id).toBe("validate_verified")
  })

  it("next action reflects source-confirmed-but-not-verified", () => {
    const trace = buildScreeningTrace({ model, verification: { sourceConfirmedCount: 4, verifiedMetadataCount: 0 } })
    expect(trace.nextActions[0].id).toBe("source_confirmed_only")
  })

  it("explains candidate ranking with score steps and uncertainty", () => {
    const ex = explainCandidateRanking(candidates[1], model)
    expect(ex.steps.find(s => s.id === "final")).toBeTruthy()
    expect(ex.mainUncertaintyEn).toMatch(/Barrier|uncertainty/i)
    expect(ex.notFinalRecommendation).toBe(true)
  })

  it("compares 2-3 candidates and explains why one outranks another", () => {
    const cmp = buildCandidateComparison([candidates[0], candidates[1]])
    expect(cmp.candidateCount).toBe(2)
    expect(cmp.comparisons.length).toBe(1)
    expect(cmp.comparisons[0].summaryEn).toMatch(/outranks/)
  })

  it("places candidates into readiness quadrants", () => {
    const matrix = buildReadinessMatrix(candidates)
    expect(matrix.points.length).toBe(2) // excludes G=0
    const a = matrix.points.find(p => p.candidateId === "A")
    expect(a.quadrant).toBe("priority_validation")
  })
})
