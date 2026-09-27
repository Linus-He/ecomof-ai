import { describe, expect, it } from "vitest"
import additions from "../../../data/curation/catalysis/literature-additions-v1.json"
import batch from "../../../data/curation/catalysis/literature-batches/co2-mof-literature-100-2026-09-27.json"
import catalog from "../../../public/data/catalysis_v2/catalysis_literature_catalog_v1.json"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import { validateLiteratureAdditions } from "../../../scripts/catalysis/catalysis-literature-validation.mjs"

const records = additions.records.filter(row => row.batchId === batch.batchId)
describe("100-paper catalysis metadata admission", () => {
  it("adds exactly 100 unique publications while retaining the existing catalog", () => {
    expect(records).toHaveLength(100)
    expect(new Set(records.map(row => row.doi)).size).toBe(100)
    expect(catalog.records).toHaveLength(124)
    expect(catalog.records.filter(row => row.batchId !== batch.batchId)).toHaveLength(24)
    expect(() => validateLiteratureAdditions(additions.records, [batch])).not.toThrow()
    for (const row of records) {
      expect(catalog.records.find(item => item.doi === row.doi)).toMatchObject(row)
      expect(database.tables.sourceDocuments.some(item => item.doi.toLowerCase() === row.doi)).toBe(false)
      expect(row).toMatchObject({ compareEligible: false, trainingEligible: false, fullTextReuseStatus: "not-established" })
      expect(row.summaryZh).toContain("题录概述")
      expect(row.summaryZh).toContain("数值尚待核验")
    }
  })
  it("rejects metadata drift, missing papers, duplicates and accidental eligibility", () => {
    const changed = (key, value) => records.map((row, index) => index ? row : { ...row, [key]: value })
    for (const [key, value] of [["title", "Wrong paper"], ["journal", "Wrong journal"], ["year", 1900], ["sourceUrl", "https://example.com"], ["trainingEligible", true], ["compareEligible", true]]) {
      expect(() => validateLiteratureAdditions(changed(key, value), [batch])).toThrow()
    }
    expect(() => validateLiteratureAdditions(records.slice(1), [batch])).toThrow(/Incomplete/)
    expect(() => validateLiteratureAdditions([...records, records[0]], [batch])).toThrow(/Duplicate/)
  })
})
