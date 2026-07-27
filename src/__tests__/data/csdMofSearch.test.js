import { describe, expect, it } from "vitest"
import {
  groupCsdMofRecords,
  publicMofDisplayName,
  searchCsdMofCatalog,
} from "../../utils/csdMofSearch.mjs"

const uioVariants = ["RUBTAK", "RUBTAK01", "RUBTAK02"].map(refcode => ({
  refcode,
  commonName: "UiO-66",
  searchAliases: ["UiO-66", "UiO66", "Zr-BDC"],
  preferredAliasRefcode: "RUBTAK",
  metalElements: ["Zr"],
}))

const identityRecords = [
  { recordType: "identity-only", identityId: "dut-60", commonName: "DUT-60", searchAliases: ["DUT60"] },
  {
    recordType: "identity-only",
    identityId: "dut-68",
    commonName: "DUT-68",
    searchAliases: ["DUT68"],
    externalCsdRefcodes: ["XICYUF"],
  },
]

describe("CSD MOF catalog search", () => {
  it("groups common-name structure variants into one UiO-66 family result", () => {
    const results = searchCsdMofCatalog(uioVariants, [], "Ui o")
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      recordType: "structure-family",
      publicDisplayName: "UiO-66",
      variantCount: 3,
      refcode: "RUBTAK",
    })
    expect(results[0].variants.map(record => record.refcode)).toEqual(["RUBTAK", "RUBTAK01", "RUBTAK02"])
  })

  it("treats a hyphenated DUT series query as a common-name prefix, not an arbitrary Refcode substring", () => {
    const structures = [
      { refcode: "DAMDUT", metalElements: ["Zn"] },
      { refcode: "DUTJUZ", metalElements: ["Zn"] },
      { refcode: "HEFDUT", metalElements: ["Cd"] },
      { refcode: "IDUTAF", metalElements: ["Cu"] },
    ]
    const results = searchCsdMofCatalog(structures, identityRecords, "DUT-")
    expect(results.map(record => record.publicDisplayName)).toEqual(["DUT-60", "DUT-68"])
  })

  it("shows ordinary CSD records by Refcode and never by an EcoMOF internal identifier", () => {
    const record = {
      refcode: "ABAVOP",
      displayName: "EcoMOF-Zn-ABAVOP",
      platformName: "EcoMOF-Zn-ABAVOP",
    }
    expect(publicMofDisplayName(record)).toBe("ABAVOP")
    expect(groupCsdMofRecords([record], [])[0].publicDisplayName).toBe("ABAVOP")
    expect(publicMofDisplayName({ displayName: "EcoMOF-Zn-ORPHAN" })).toBe("")
  })
})
