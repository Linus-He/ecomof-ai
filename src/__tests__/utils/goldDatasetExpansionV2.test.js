// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v3.json"

const PENDING = ["pending", "unknown", "", "missing", "null"]
const isReal = v => v != null && !PENDING.includes(String(v).toLowerCase())

describe("Gold Dataset expansion (V3.3)", () => {
  it("expands Gold to at least 300 records", () => {
    expect(gold.goldCount).toBeGreaterThanOrEqual(300)
    expect(gold.sufficient).toBe(true)
    expect(gold.records.length).toBe(gold.goldCount)
  })

  it("requires real source + DOI + citation on every Gold record", () => {
    for (const r of gold.records) {
      expect(isReal(r.evidence?.doi)).toBe(true)
      expect(isReal(r.evidence?.citation)).toBe(true)
      expect(r.qualityTier).toBe("Gold")
    }
  })

  it("never admits derived or synthetic records into Gold", () => {
    expect(gold.records.every(r => r.datasetOrigin === "external_database")).toBe(true)
    expect(gold.records.some(r => r.datasetOrigin === "derived_dataset" || r.syntheticFixture)).toBe(false)
  })
})
