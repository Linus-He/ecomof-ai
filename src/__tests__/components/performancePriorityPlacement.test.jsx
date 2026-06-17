// @ts-nocheck
import { describe, expect, it } from "vitest"
import { TABS } from "../../constants/badges"
import { PERFORMANCE_PRIORITY_MODES, resolvePerformancePriorityMode } from "../../utils/performancePriority"

describe("V2.7 performance priority placement", () => {
  it("removes the standalone Performance Priority tab from the top tab bar", () => {
    const ids = TABS.map(tab => tab.id)
    expect(ids).not.toContain("performance")
    expect(ids).toContain("ecoscreen")
  })

  it("keeps a centralized performance priority config with the six run-setup modes", () => {
    const ids = PERFORMANCE_PRIORITY_MODES.map(mode => mode.id)
    expect(ids).toEqual(expect.arrayContaining([
      "balanced", "performance_first", "evidence_first", "provenance_first", "validation_readiness_first", "low_risk_first",
    ]))
    // Every mode carries Chinese + English names and a description.
    for (const mode of PERFORMANCE_PRIORITY_MODES) {
      expect(mode.label && mode.labelZh).toBeTruthy()
      expect(mode.description && mode.descriptionZh).toBeTruthy()
    }
    // Resolver falls back to balanced for an unknown mode.
    expect(resolvePerformancePriorityMode("not-a-mode").id).toBe("balanced")
  })
})
