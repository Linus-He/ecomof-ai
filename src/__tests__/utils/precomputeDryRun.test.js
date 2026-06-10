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
})
