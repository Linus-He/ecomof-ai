// @ts-nocheck
import { describe, expect, it } from "vitest"
import { auditModelStability, classifyStability } from "../../utils/benchmark/modelStabilityAudit"

describe("Model Stability Audit", () => {
  it("classifies stability by coefficient of variation", () => {
    expect(classifyStability(0.05)).toBe("Stable")
    expect(classifyStability(0.15)).toBe("Moderately Stable")
    expect(classifyStability(0.4)).toBe("Unstable")
  })

  it("computes variance / std / CV per model from CV folds", () => {
    const cv = { k: 5, models: [{ model: "Random Forest", folds: [{ accuracy: 0.8 }, { accuracy: 0.8 }, { accuracy: 0.8 }, { accuracy: 0.8 }, { accuracy: 0.8 }] }] }
    const audit = auditModelStability(cv)
    expect(audit.rows[0].std).toBe(0)
    expect(audit.rows[0].coefficientOfVariation).toBe(0)
    expect(audit.rows[0].stability).toBe("Stable")
    expect(audit.overallStability).toBe("Stable")
  })

  it("flags an unstable model with high fold variance", () => {
    const cv = { k: 4, models: [{ model: "Decision Tree", folds: [{ accuracy: 1 }, { accuracy: 0.2 }, { accuracy: 0.9 }, { accuracy: 0.3 }] }] }
    const audit = auditModelStability(cv)
    expect(audit.rows[0].std).toBeGreaterThan(0)
    expect(["Moderately Stable", "Unstable"]).toContain(audit.rows[0].stability)
  })
})
