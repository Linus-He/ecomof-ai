// @ts-nocheck
import { describe, expect, it } from "vitest"
import fs from "node:fs"
import anatomy from "../../../public/data/mof_anatomy_identity_index_v1.json"
import aliases from "../../data/csdCommonAliases.json"
import methodology from "../../../public/data/methodology_modules_demo.json"

describe("MOF Anatomy governed identity index", () => {
  it("covers the complete public directory with factual pointers only", () => {
    expect(anatomy.summary.recordCount).toBe(185)
    expect(anatomy.summary.recordsWithDoi).toBe(185)
    expect(anatomy.summary.recordsWithCcdcNumber).toBe(175)
    expect(anatomy.source.redistributionAuthorized).toBe(false)
    expect(anatomy.source.excludedAssets).toEqual(expect.arrayContaining([
      "rendered structure images",
      "XYZ files",
      "cleaned crystal structures",
    ]))
  })

  it("resolves DUT-68 as an identity and literature record without inventing properties", () => {
    const dut = anatomy.records.find(record => record.canonicalName === "DUT-68")
    expect(dut?.associatedPaper?.doi).toBe("10.1021/cg301691d")
    expect(dut?.ccdcNumber).toBe("902900")
    expect(dut?.topology).toBe("bon")
    expect(dut).not.toHaveProperty("surfaceArea")
    expect(dut).not.toHaveProperty("poreVolume")
  })

  it("keeps independently verified names such as NTU-68 in the curated fallback registry", () => {
    const ntu = aliases.aliases.find(record => record.canonicalName === "NTU-68")
    expect(ntu?.associatedPaper?.doi).toBe("10.1021/jacs.3c10277")
    expect(ntu?.refcodes).toHaveLength(0)
    expect(ntu?.structureMappingStatus).toMatch(/CIF|CCDC/)
  })

  it("removes the obsolete performance module and installs current Organic Acid rules", () => {
    expect(methodology.some(module => module.id === "performance")).toBe(false)
    const organic = methodology.find(module => module.id === "organic-acid")
    expect(organic?.summaryZh).toMatch(/V3\.9\.10|丰度中性/)
    expect(organic?.methodGroups.map(group => group.id)).toEqual([
      "organic-data-governance-current",
      "organic-abundance-neutral-current",
      "organic-hgcps-current",
      "organic-audit-current",
    ])
    const source = fs.readFileSync("src/components/tabs/MethodsLimitationsTab.tsx", "utf8")
    expect(source).not.toMatch(/"performance"/)
    expect(source).toMatch(/CurrentOrganicAcidMethodology/)
  })
})
