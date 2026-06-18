// @ts-nocheck
import { describe, expect, it } from "vitest"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import { auditBenchmarkEligibility } from "../../utils/dataAudit/benchmarkEligibilityAudit"

describe("Benchmark Eligibility Audit", () => {
  it("confirms at least 100 of the claimed benchmark-eligible records on real data", () => {
    const audit = auditBenchmarkEligibility(benchmark.records)
    expect(audit.eligibleConfirmed).toBeGreaterThanOrEqual(100)
    expect(audit.eligibleRejected).toBe(0)
    expect(audit.status).toBe("Pass")
  })

  it("rejects a claimed-eligible record that is missing ground truth and quality tier", () => {
    const audit = auditBenchmarkEligibility([
      { recordId: "bad", labelStatus: "missing", qualityTier: "Bronze", split: "train" },
    ])
    expect(audit.claimed).toBe(1)
    expect(audit.eligibleConfirmed).toBe(0)
    expect(audit.eligibleRejected + audit.eligibleWarnings).toBeGreaterThan(0)
  })
})
