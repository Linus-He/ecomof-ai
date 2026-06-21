// @ts-nocheck
import { describe, expect, it } from "vitest"
import { DATA_SOURCE_REGISTRY, enrichRegistry, summarizeRegistry, countRecords, getSourcesByParticipation } from "../../data/registry/dataSourceRegistry"
import { DATA_MODES, DATASET_TYPES } from "../../data/registry/datasetTypes"

describe("V3.9 data source registry", () => {
  it("catalogs the data sources with valid types and modes", () => {
    expect(DATA_SOURCE_REGISTRY.length).toBeGreaterThanOrEqual(10)
    for (const s of DATA_SOURCE_REGISTRY) {
      expect(DATASET_TYPES).toContain(s.datasetType)
      expect(DATA_MODES).toContain(s.dataMode)
      expect(Array.isArray(s.participatesIn)).toBe(true)
      expect(typeof s.hasProvenance).toBe("boolean")
    }
  })

  it("counts records by recordKey / array / labels", () => {
    expect(countRecords([1, 2, 3])).toBe(3)
    expect(countRecords({ records: [1, 2] }, "records")).toBe(2)
    expect(countRecords({ labels: [1] })).toBe(1)
    expect(countRecords(null)).toBe(0)
  })

  it("enriches with live counts and flags unloaded sources", () => {
    const enriched = enrichRegistry({ "experimental-labels": { labels: new Array(150) } })
    const exp = enriched.find(s => s.id === "experimental-labels")
    expect(exp.recordCount).toBe(150)
    expect(exp.loaded).toBe(true)
    const other = enriched.find(s => s.id !== "experimental-labels")
    expect(other.recordCount).toBe(0)
    expect(other.loaded).toBe(false)
  })

  it("summarizes registry with category/mode/type breakdowns and provenance share", () => {
    const summary = summarizeRegistry({ "experimental-labels": { labels: new Array(150) }, "external-test": { records: new Array(80) } })
    expect(summary.sourceCount).toBe(DATA_SOURCE_REGISTRY.length)
    expect(summary.loadedCount).toBe(2)
    expect(summary.totalRecords).toBe(230)
    expect(summary.byCategory.Benchmark).toBe(230)
    expect(summary.provenanceShare).toBeGreaterThan(0)
    expect(summary.provenanceShare).toBeLessThanOrEqual(1)
  })

  it("answers participation queries", () => {
    expect(getSourcesByParticipation("export").length).toBeGreaterThan(0)
    expect(getSourcesByParticipation("home").every(s => s.participatesIn.includes("home"))).toBe(true)
  })
})
