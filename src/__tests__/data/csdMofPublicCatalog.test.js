import { describe, expect, it } from "vitest"
import { attachCsdPublicUrls } from "../../services/dataService"

describe("CSD MOF public catalog", () => {
  it("attaches a sharded public CIF URL without changing source metadata", () => {
    const sourceRecord = {
      refcode: "ABADUG",
      path: "cif/ab/abadug_P1.cif",
      formula: "(C153 H90 N6 O27 Zn6)n",
      sha256: "443378b43ee29ed5ccdb0d9d85a9192c3c15ba579a2981485c30bc57f339ecd6",
    }

    const catalog = attachCsdPublicUrls(
      { structures: [sourceRecord], summary: { total: 15906 } },
      "https://example.org/ecomof-csd-mof-data",
    )

    expect(catalog.publicBaseUrl).toBe("https://example.org/ecomof-csd-mof-data/")
    expect(catalog.structures[0]).toEqual({
      ...sourceRecord,
      cifUrl: "https://example.org/ecomof-csd-mof-data/cif/ab/abadug_P1.cif",
    })
    expect(catalog.summary.total).toBe(15906)
  })
})
