// @ts-nocheck
import { describe, expect, it } from "vitest"
import reactionDataset from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import { buildReactionDataset } from "../../utils/reaction/buildReactionDataset"

describe("V3.1 reaction dataset builder", () => {
  it("builds a reaction dataset with complete source-backed reaction fields", () => {
    expect(reactionDataset.records.length).toBeGreaterThanOrEqual(50)
    const record = reactionDataset.records[0]
    for (const field of ["reactionId", "product", "mofName", "metalNode", "temperature", "pressure", "solvent", "reactionTime", "yield", "selectivity", "conversion", "doi", "citation"]) {
      expect(record[field]).not.toBeNull()
      expect(String(record[field])).not.toMatch(/pending|synthetic fixture/i)
    }
    expect(record.fieldSources.yield.citation).toBeTruthy()
    expect(record.validationStatus).toBe("Gold")
  })

  it("reuses the builder without algorithm scores as labels", () => {
    const sourceRecords = [{
      recordId: "source-1",
      candidateId: "mof-1",
      displayName: "MOF-1",
      doi: "10.0000/source-1",
      citation: "Source citation",
      sourceUrl: "https://example.test/source-1",
      syntheticFixture: false,
      metalNode: "Zr",
    }]
    const built = buildReactionDataset({ sourceRecords, count: 3 })
    expect(built.records).toHaveLength(3)
    expect(built.records.every(row => /algorithm scores are not used/i.test(row.labelPolicy))).toBe(true)
  })
})
