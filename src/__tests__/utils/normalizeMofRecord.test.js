// @ts-nocheck
import { describe, expect, it } from "vitest"
import { normalizeMofRecord } from "../../utils/dataStandardization/normalizeMofRecord"

describe("normalizeMofRecord", () => {
  it("maps identifiers and metals into the MOF layer", () => {
    const out = normalizeMofRecord({ id: "m1", name: "UiO-66", metals: ["Zr"], topology: "fcu", surfaceArea: 1200, poreVolume: 0.7 }, { sourceId: "SRC-REAL-SEED" })
    expect(out.mofId).toBe("m1")
    expect(out.displayName).toBe("UiO-66")
    expect(out.metalNode).toBe("Zr")
    expect(out.surfaceArea).toBe(1200)
    expect(out.fieldSources.surfaceArea.normalizedUnit).toBe("m^2/g")
  })

  it("normalizes pore size from nm to angstrom with provenance", () => {
    const out = normalizeMofRecord({ id: "m2", displayName: "X", metalNode: "Al", poreSizeA: { value: 1.2, unit: "nm" } }, { sourceId: "S" })
    expect(out.poreSizeA).toBe(12)
    const fs = out.fieldSources.poreSizeA
    expect(fs.originalUnit).toBe("nm")
    expect(fs.normalizedUnit).toBe("angstrom")
    expect(fs.normalizationMethod).toBe("nm->angstrom")
    expect(fs.fieldSource).toBe("S")
  })

  it("keeps missing numeric fields null instead of fabricating values", () => {
    const out = normalizeMofRecord({ id: "m3", displayName: "Y", metalNode: "Cu" }, { sourceId: "S" })
    expect(out.surfaceArea).toBeNull()
    expect(out.fieldSources.surfaceArea.status).toBe("missing")
  })
})
