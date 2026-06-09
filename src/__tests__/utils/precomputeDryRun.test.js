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
})
