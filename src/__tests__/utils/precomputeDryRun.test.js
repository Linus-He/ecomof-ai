// @ts-nocheck
import { describe, expect, it } from "vitest"
import { runPrecomputeDryRun } from "../../../scripts/precompute-database-score-dry-run.mjs"

describe("precompute database-score dry run", () => {
  it("runs offline over local fixtures and reports not-final counts", () => {
    const originalFetch = global.fetch
    // Prove the dry-run does not touch the network.
    global.fetch = () => { throw new Error("network access is not allowed in the dry run") }
    try {
      const summary = runPrecomputeDryRun()

      expect(summary.mode).toBe("dry_run")
      expect(summary.notFinalRecommendation).toBe(true)
      expect(summary.recordsScanned).toBeGreaterThan(0)

      // Bounded fixture set only — not the full database / all parts.
      expect(summary.fixturesUsed.length).toBeLessThanOrEqual(2)
      expect(summary.fixturesUsed.every(row => !/index_part_00[2-9]/.test(row.file))).toBe(true)

      const metaSum = summary.metadata.verified + summary.metadata.partial + summary.metadata.previewOnly + summary.metadata.blocked
      expect(metaSum).toBe(summary.recordsScanned)
      expect(summary.metadata).toEqual(expect.objectContaining({
        verified: expect.any(Number),
        partial: expect.any(Number),
        previewOnly: expect.any(Number),
        blocked: expect.any(Number),
      }))

      const descSum = summary.descriptorCompleteness.complete + summary.descriptorCompleteness.partial + summary.descriptorCompleteness.missingCritical
      expect(descSum).toBe(summary.recordsScanned)
      expect(summary.boundary).toMatch(/Not full verified database screening/)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("reads the V2.0-G sample and emits redundancy / mechanism / trace summaries", () => {
    const summary = runPrecomputeDryRun()

    expect(summary.sampleSource).toBe("v2_0_g_verified_sample")
    expect(summary.recordsScanned).toBeLessThanOrEqual(200)
    expect(Object.keys(summary.sourceDistribution).length).toBeGreaterThan(0)

    // Descriptor redundancy gate output.
    expect(summary.redundancyGate.redundantPairCount).toBeGreaterThan(0)
    expect(summary.redundancyGate.redundantPairs.some(p => Math.abs(p.pearsonR) > 0.7)).toBe(true)

    // Mechanism proxy availability per proxy key.
    expect(summary.mechanismProxyAvailability.co2ActivationProxy).toBeGreaterThanOrEqual(0)
    expect(summary.mechanismProxyAvailability.evidenceConfidenceProxy).toBe(summary.recordsScanned)

    // Algorithm improvement trace stages, with no model-accuracy metrics.
    const traceIds = summary.algorithmImprovementTrace.map(s => s.id)
    expect(traceIds).toContain("metadata_gate")
    expect(traceIds).toContain("redundancy_gate")
    expect(traceIds).toContain("mechanism_proxy")
    expect(traceIds).toContain("preview_output")
    expect(JSON.stringify(summary)).not.toMatch(/R\^2|R²|\bMAE\b|\bRMSE\b/i)
  })

  it("emits V2.0-H verification queue, sensitivity, ablation, and mechanism-evidence summaries", () => {
    const summary = runPrecomputeDryRun()

    expect(summary.nearVerifiedCount).toBeGreaterThan(0)
    expect(summary.verificationQueueSummary.queueSize).toBeGreaterThan(0)

    expect(summary.sensitivityAudit.top5Stability).toBeGreaterThanOrEqual(0)
    expect(summary.sensitivityAudit.top5Stability).toBeLessThanOrEqual(1)
    expect(summary.sensitivityAudit.auditRuns).toBeGreaterThan(0)

    expect(summary.featureAblationAudit.map(v => v.id)).toContain("without_mechanism_proxies")
    expect(summary.mechanismEvidenceSummary).toEqual(expect.objectContaining({
      literature_supported: expect.any(Number),
      descriptor_inferred: expect.any(Number),
      weak_proxy: expect.any(Number),
      insufficient_evidence: expect.any(Number),
    }))

    // Sensitivity stage in the trace is no longer empty.
    const sensitivityStage = summary.algorithmImprovementTrace.find(s => s.id === "sensitivity_audit")
    expect(sensitivityStage.outputCount).toBeGreaterThan(0)
    expect(JSON.stringify(summary)).not.toMatch(/accuracy/i)
  })

  it("emits V2.0-I manual curation and metadata transition summaries", () => {
    const summary = runPrecomputeDryRun()

    expect(summary.manualCurationSummary.queueSize).toBeGreaterThan(0)
    expect(summary.manualCurationSummary.statusCounts).toBeTruthy()
    expect(summary.metadataTransitionSummary).toEqual(expect.objectContaining({
      nearVerifiedBeforeCuration: expect.any(Number),
      verifiedAfterCuration: expect.any(Number),
      sourceConfirmed: expect.any(Number),
      citationReady: expect.any(Number),
      licenseConfirmed: expect.any(Number),
      curationBlocked: expect.any(Number),
    }))
    // No fabricated verified candidates from curation alone.
    expect(summary.metadataTransitionSummary.verifiedAfterCuration).toBe(0)

    const traceIds = summary.algorithmImprovementTrace.map(s => s.id)
    expect(traceIds).toContain("manual_metadata_curation")
    expect(traceIds).toContain("source_link_enrichment")
    const enrichment = summary.algorithmImprovementTrace.find(s => s.id === "source_link_enrichment")
    expect(enrichment.status).toBe("pending")
    expect(summary.notFinalRecommendation).toBe(true)
  })

  it("emits V2.0-K evidence backfill, verified candidate report, and next-action summaries", () => {
    const summary = runPrecomputeDryRun()

    expect(summary.evidenceBackfillSummary).toBeTruthy()
    expect(summary.evidenceBackfillSummary.recordCount).toBeGreaterThan(0)
    expect(summary.verifiedCandidateReportSummary).toEqual(expect.objectContaining({
      reportStatus: expect.any(String),
      verifiedMetadataCount: expect.any(Number),
    }))
    // Verified stays 0 without confirmed evidence.
    expect(summary.verifiedCandidateReportSummary.verifiedMetadataCount).toBe(0)
    expect(summary.metadataBackfillTransitionSummary).toEqual(expect.objectContaining({
      nearVerifiedBeforeBackfill: expect.any(Number),
      sourceConfirmedAfterBackfill: expect.any(Number),
      verifiedAfterBackfill: expect.any(Number),
    }))
    expect(summary.nextActionSummary).toBeTruthy()

    const traceIds = summary.algorithmImprovementTrace.map(s => s.id)
    expect(traceIds).toContain("evidence_backfill")
    expect(traceIds).toContain("verified_candidate_report")
    const report = summary.algorithmImprovementTrace.find(s => s.id === "verified_candidate_report")
    expect(report.status).toBe("no_verified_candidates_yet")
    expect(JSON.stringify(summary)).not.toMatch(/R\^2|R²|\bMAE\b|\bRMSE\b|accuracy/i)
    expect(summary.notFinalRecommendation).toBe(true)
  })
})
