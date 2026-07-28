// @ts-nocheck
import { describe, expect, it } from "vitest"
import literature from "../../../public/data/organic_acid_literature_dataset_v3.json"
import { importOrganicAcidLiterature, mapLiteratureRow } from "../../utils/dataIngestion/importOrganicAcidLiteratureV2"

describe("Organic Acid literature import (V2)", () => {
  it("quarantines the legacy generated V3.3 literature rows", () => {
    expect(literature.total).toBe(0)
    expect(literature.records).toEqual([])
    expect(literature.status).toBe("quarantined")
  })

  it("keeps records with a real DOI + all critical fields Gold-eligible", () => {
    const row = mapLiteratureRow({ recordId: "L1", doi: "10.1021/example", citation: "Real et al.", product: "formic acid", temperature: 170, pressure: 30, solvent: "water", reactionTime: 12, catalyst: "UiO-66", yield: 42, selectivity: 88 })
    expect(row.goldEligible).toBe(true)
    expect(row.qualityTier).toBe("Gold")
  })

  it("never lets a DOI-missing record reach Gold", () => {
    const row = mapLiteratureRow({ recordId: "L2", doi: "pending", product: "formic acid", temperature: 170, pressure: 30, solvent: "water", reactionTime: 12, catalyst: "UiO-66", yield: 42, selectivity: 88 })
    expect(row.goldEligible).toBe(false)
    expect(row.qualityTier).not.toBe("Gold")
    expect(row.missingCriticalFields).toContain("doi")
  })

  it("normalizes reaction conditions on import", () => {
    const result = importOrganicAcidLiterature([{ recordId: "L3", temperature: { value: 443.15, unit: "K" }, pressure: 30, solvent: "water", reactionTime: 12, yield: 42, selectivity: 88, product: "formic acid", catalyst: "X" }])
    expect(result.records[0].temperature).toBeCloseTo(170, 0)
  })
})
