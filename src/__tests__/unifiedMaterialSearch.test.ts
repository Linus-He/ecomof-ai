import { describe, expect, it } from "vitest"
import { searchMaterials } from "../utils/unifiedMaterialSearch"
import records from "../../public/data/core_mof_2024/cr_search_index.json"
import aliases from "../../public/data/mof_name_aliases.json"

describe("unified material search", () => {
  it("finds real names, unicode dashes, and curated aliases", () => {
    for (const query of ["UiO-66", "ZIF–8", "HKUST1", "Cu-BTC", "MOF-199"]) {
      expect(searchMaterials(records, aliases, query).length, query).toBeGreaterThan(0)
    }
  })
  it("retains record-specific properties and resolves an exact refcode first", () => {
    const hits = searchMaterials(records, aliases, "ABAVIJ")
    expect(hits[0].record.csdRefcode).toBe("ABAVIJ")
    expect(hits[0].record.surfaceArea).toBe(0)
    expect(hits[0].record.doi).toBe("10.1039/b404485a")
    expect(searchMaterials(records, aliases, "no-such-crystal-999")).toEqual([])
  })
})
