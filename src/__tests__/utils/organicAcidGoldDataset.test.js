// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v1.json"
import labels from "../../../public/data/organic_acid_labels_v1.json"
import { validateRecord, validateDuplicates } from "../../utils/dataValidation/index"
import { normalizeOrganicAcidRecord } from "../../utils/dataStandardization/normalizeOrganicAcidRecord"

const PENDING = ["pending", "unknown", "ambiguous", "restricted", "missing", "", "null"]
const isReal = v => v != null && !PENDING.includes(String(v).trim().toLowerCase())

describe("Organic Acid Gold Dataset V1", () => {
  it("declares the dataset and meets the Gold sufficiency threshold honestly", () => {
    expect(gold.datasetId).toBe("organic-acid-gold-dataset-v1")
    expect(gold.goldCount).toBe(gold.records.length)
    expect(gold.records.length).toBeGreaterThanOrEqual(20)
    expect(gold.sufficient).toBe(true)
  })

  it("requires a real DOI and a real citation on every Gold record", () => {
    for (const record of gold.records) {
      expect(isReal(record.evidence?.doi)).toBe(true)
      expect(isReal(record.evidence?.citation)).toBe(true)
      expect(record.qualityTier).toBe("Gold")
    }
  })

  it("never lets a synthetic fixture into the Gold dataset", () => {
    expect(gold.records.some(r => r.syntheticFixture)).toBe(false)
  })

  it("rejects a DOI-missing record from Gold via the validation gate", () => {
    const noDoi = normalizeOrganicAcidRecord({ id: "X", displayName: "X", metalNode: "Zr", reactionId: "r", targetProduct: "formic acid", surfaceArea: 900 }, { sourceId: "S" })
    expect(validateRecord(noDoi).qualityTier).not.toBe("Gold")
  })

  it("rejects a synthetic fixture from Gold via the validation gate", () => {
    const synthetic = normalizeOrganicAcidRecord({ id: "Y", displayName: "Y", metalNode: "Zr", reactionId: "r", targetProduct: "formic acid", doi: "10.1/z", citation: "c", sourceUrl: "u", syntheticFixture: true }, { sourceId: "S" })
    expect(validateRecord(synthetic).qualityTier).toBe("Bronze")
  })

  it("contains no duplicate records and keeps all labels missing (no fabricated labels)", () => {
    const dup = validateDuplicates(gold.records)
    expect(dup.duplicates).toHaveLength(0)
    expect(labels.labels.every(l => l.label === null && l.labelStatus === "missing")).toBe(true)
  })
})
