// @ts-nocheck
import { describe, expect, it } from "vitest"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import { auditReactionDataset } from "../../utils/dataAudit/reactionAudit"

describe("Reaction Dataset Audit", () => {
  it("distributes records across comparability buckets on the real dataset", () => {
    const audit = auditReactionDataset(reaction.records)
    const dist = audit.comparabilityDistribution
    const total = dist.Comparable + dist.PartiallyComparable + dist.NotComparable
    expect(total).toBe(reaction.records.length)
    expect(dist.Comparable).toBeGreaterThan(0)
    expect(audit.status).toBe("Pass")
  })

  it("classifies comparability by present condition + outcome fields", () => {
    const audit = auditReactionDataset([
      { temperature: 90, pressure: 5, solvent: "water", reactionTime: 4, yield: 18, selectivity: 46 },
      { temperature: 90, pressure: 5, solvent: "water" },
      { temperature: 90 },
    ])
    expect(audit.comparabilityDistribution.Comparable).toBe(1)
    expect(audit.comparabilityDistribution.PartiallyComparable).toBe(1)
    expect(audit.comparabilityDistribution.NotComparable).toBe(1)
  })
})
