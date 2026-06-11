// @ts-nocheck
import { describe, expect, it } from "vitest"
import {
  buildScreeningNextActions,
  buildScreeningRunResult,
  buildScreeningRunSteps,
  getInitialScreeningRunState,
  runScreeningAuditSimulation,
} from "../../utils/databaseIndex/screeningRunState"

const summary = {
  recordsScanned: 120,
  nearVerifiedCount: 12,
  metadata: { verified: 0, partial: 12, previewOnly: 108, blocked: 0 },
  descriptorCompleteness: { complete: 0, partial: 120, missingCritical: 0 },
  redundancyGate: { redundantPairCount: 2 },
  mechanismProxyAvailability: { co2ActivationProxy: 120, evidenceConfidenceProxy: 120 },
  mechanismEvidenceSummary: { literature_supported: 0, descriptor_inferred: 360, weak_proxy: 480, insufficient_evidence: 0 },
  sensitivityAudit: { top5Stability: 0.886, top10Stability: 0.908, unstableCandidateCount: 3, auditRuns: 100 },
  featureAblationAudit: [
    { id: "all_descriptors", topNOverlapWithBaseline: 1 },
    { id: "without_redundant_descriptors", topNOverlapWithBaseline: 0.7 },
    { id: "without_mechanism_proxies", topNOverlapWithBaseline: 0.9 },
    { id: "metadata_gate_only", topNOverlapWithBaseline: 0.2 },
  ],
  candidateValidationRoadmapSummary: { candidateCount: 12, priorityCounts: { high: 12, medium: 0, low: 0 } },
  manualCurationSummary: { queueSize: 18 },
  metadataTransitionSummary: { nearVerifiedBeforeCuration: 12, verifiedAfterCuration: 0, sourceConfirmed: 0, citationReady: 0, licenseConfirmed: 0 },
}

describe("screeningRunState", () => {
  it("starts idle with 12 pending steps", () => {
    const state = getInitialScreeningRunState(summary)
    expect(state.status).toBe("idle")
    expect(state.steps).toHaveLength(12)
    expect(state.steps.every(s => s.status === "pending")).toBe(true)
  })

  it("builds 12 steps each with status / counts / boundary", () => {
    const steps = buildScreeningRunSteps(summary)
    expect(steps).toHaveLength(12)
    for (const step of steps) {
      expect(step.status).toBeTruthy()
      expect(Number.isFinite(step.inputCount)).toBe(true)
      expect(Number.isFinite(step.outputCount)).toBe(true)
      expect(step.boundary).toBeTruthy()
    }
  })

  it("is blocked when no records are scanned", () => {
    expect(getInitialScreeningRunState({ recordsScanned: 0 }).status).toBe("blocked")
    expect(runScreeningAuditSimulation({ recordsScanned: 0, metadata: {} }).status).toBe("blocked")
  })

  it("ends in warning when verified_metadata is 0 (deterministic)", () => {
    const a = runScreeningAuditSimulation(summary)
    const b = runScreeningAuditSimulation(summary)
    expect(a.status).toBe("warning")
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps))
    expect(a.notFinalRecommendation).toBe(true)
  })

  it("builds a result with 5 groups and a not-final conclusion, no accuracy metrics", () => {
    const result = buildScreeningRunResult(summary)
    expect(result.groups).toHaveLength(5)
    expect(result.conclusionEn).toMatch(/not a final recommendation/i)
    expect(result.conclusionZh).toMatch(/不能作为最终推荐/)
    expect(JSON.stringify(result)).not.toMatch(/R\^2|R²|\bMAE\b|\bRMSE\b|accuracy/i)
    expect(result.notFinalRecommendation).toBe(true)
  })

  it("generates next actions for verified=0, sourceConfirmed=0 and literature=0", () => {
    const { actions } = buildScreeningNextActions(summary)
    const ids = actions.map(a => a.id)
    expect(ids).toContain("curate_near_verified")
    expect(ids).toContain("confirm_source")
    expect(ids).toContain("backfill_literature")
    // No dangerous experimental protocols.
    expect(JSON.stringify(actions).toLowerCase()).not.toMatch(/temperature|pressure|reagent|recipe|protocol/)
  })

  it("adds an Evidence Backfill result group and a no-verified conclusion when the V2.0-K summary is present", () => {
    const v2kSummary = {
      ...summary,
      evidenceBackfillSummary: {
        recordCount: 18,
        sourceStatusCounts: { confirmed: 0, pending: 18 },
        citationStatusCounts: { ready: 0, pending: 18 },
        licenseStatusCounts: { confirmed: 0, pending: 18 },
        doiStatusCounts: { confirmed: 0, pending: 18, not_available: 0 },
        descriptorProvenanceStatusCounts: { complete: 12, partial: 6, incomplete: 0 },
        mechanismEvidenceStatusCounts: { weak_proxy: 18 },
        verifiedMetadataEligible: 0,
        verifiedMetadataCount: 0,
      },
      verifiedCandidateReportSummary: { reportStatus: "no_verified_candidates_yet", verifiedMetadataCount: 0, nearVerifiedCount: 8 },
    }
    const result = buildScreeningRunResult(v2kSummary)
    expect(result.groups.some(g => g.id === "evidenceBackfill")).toBe(true)
    expect(result.conclusionEn).toMatch(/No verified candidates yet/i)
    expect(result.conclusionZh).toMatch(/暂无经核验候选|当前仍无经核验候选/)

    const { actions } = buildScreeningNextActions(v2kSummary)
    const ids = actions.map(a => a.id)
    expect(ids).toContain("first_verified_loop")
    expect(ids).toContain("confirm_citation")
    expect(ids).toContain("confirm_license")
    expect(ids).toContain("backfill_provenance")
  })
})
