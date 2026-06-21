// @ts-nocheck
import { describe, expect, it } from "vitest"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import { buildGlobalDatabaseSummary } from "../../utils/summary/buildGlobalDatabaseSummary"
import { buildResearchReportsSummary } from "../../utils/summary/buildResearchReportsSummary"
import { buildVersionHistorySummary, parseVersionKey } from "../../utils/summary/buildVersionHistorySummary"
import { buildCurrentReleaseSummary } from "../../utils/summary/buildCurrentReleaseSummary"
import { buildExportSummary } from "../../utils/summary/buildExportSummary"

const FORBIDDEN = JSON.stringify({ a: undefined })

describe("V3.9 global summary builders", () => {
  it("buildGlobalDatabaseSummary derives totals from the registry and reacts to data", () => {
    const empty = buildGlobalDatabaseSummary({ loaded: {} })
    expect(empty.totalRecords).toBe(0)
    expect(empty.fallbackApplied).toBe(true)
    const withData = buildGlobalDatabaseSummary({ loaded: { "experimental-labels": { labels: new Array(150) } } })
    expect(withData.totalRecords).toBe(150)
    expect(withData.loadedSources).toBe(1)
    expect(withData.generatedAt).toBeTruthy()
    expect(withData.dataVersion).toBe("V3.9")
  })

  it("buildResearchReportsSummary derives Suggested Next Validation Steps from thresholds", () => {
    const lowCoverage = buildResearchReportsSummary({ descriptorCoverage: 0.4, provenanceCoverage: 0.5, benchmarkEligibleCount: 10, benchmarkTotal: 100, organicAcidEvidenceCoverage: 0.3, robustness: { generalization: { overfittingRisk: "High" } } })
    const ids = lowCoverage.suggestedNextValidationSteps.map(s => s.id)
    expect(ids).toContain("descriptor")
    expect(ids).toContain("benchmark")
    expect(ids).toContain("model-risk")
    const good = buildResearchReportsSummary({ descriptorCoverage: 0.95, provenanceCoverage: 0.95, benchmarkEligibleCount: 90, benchmarkTotal: 100, organicAcidEvidenceCoverage: 0.9, robustness: { generalization: { overfittingRisk: "Low" } } })
    expect(good.suggestedNextValidationSteps.length).toBeGreaterThan(0)
    expect(good.suggestedNextValidationSteps[0].id).toBe("ok")
  })

  it("buildVersionHistorySummary expands current, collapses recent, archives V3.5-and-earlier", () => {
    const summary = buildVersionHistorySummary({ versionEvolution })
    expect(summary.currentVersion).toBe("V3.9")
    expect(summary.groups.expanded.map(v => v.version)).toContain("V3.9")
    // V3.6 < key < V3.9 collapse (V3.7 has no entry in this repo's history).
    expect(summary.groups.collapsed.map(v => v.version)).toEqual(expect.arrayContaining(["V3.8", "V3.6"]))
    expect(summary.groups.collapsed.every(v => parseVersionKey(v.version) > 3.5 && v.version !== "V3.9")).toBe(true)
    expect(summary.groups.archived.every(v => parseVersionKey(v.version) <= 3.5)).toBe(true)
    expect(summary.categories.length).toBeGreaterThan(0)
  })

  it("buildCurrentReleaseSummary returns only the current entry", () => {
    const cr = buildCurrentReleaseSummary({ versionEvolution })
    expect(cr.version).toBe("V3.9")
    expect(cr.summary).not.toMatch(/undefined|null|\[object Object\]/)
  })

  it("buildExportSummary lists exportable targets with provenance", () => {
    const global = buildGlobalDatabaseSummary({ loaded: { "benchmark-eligible": { records: new Array(230) } } })
    const ex = buildExportSummary({ globalSummary: global })
    expect(ex.targets.length).toBeGreaterThan(0)
    expect(ex.exportableCount).toBeGreaterThan(0)
    expect(ex.targets.every(t => typeof t.provenanceIncluded === "boolean")).toBe(true)
  })
})
