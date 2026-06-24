// @ts-nocheck
import { describe, expect, it } from "vitest"
import linkerDescriptorTable from "../../../public/data/linker_descriptor_table.json"
import metalPrecursorCostTable from "../../../public/data/metal_precursor_cost_table.json"
import scoringSpec from "../../../public/data/organic_acid_scoring_spec_v2.json"
import { deriveEconomicFactors } from "../../utils/organicAcidDataDerivation/economicFactors"
import { deriveLigandFactors } from "../../utils/organicAcidDataDerivation/ligandFactors"
import { deriveSynthesizabilityFactors } from "../../utils/organicAcidDataDerivation/synthesizabilityFactors"

const hosts = [
  { displayName: "Al-MOF" },
  { displayName: "Ti-MOF" },
  { displayName: "Fe-MOF" },
]

function records(metalNode, linker, count) {
  return Array.from({ length: count }, (_, index) => ({
    mofId: `${metalNode}-${linker}-${index}`,
    metalNode,
    linker,
  }))
}

describe("organic acid V3.9.8 descriptor expansion and real prices", () => {
  it("covers every linker label present in CoRE and changes ligand support when linker data change", () => {
    expect(linkerDescriptorTable.derivationLevel).toBe("curated-ligand-descriptor")
    expect(linkerDescriptorTable.records).toHaveLength(10)

    const bdc = deriveLigandFactors(hosts, {
      coreMofImport: { records: [...records("Al", "BDC", 4), ...records("Ti", "BDC", 4), ...records("Fe", "BDC", 4)] },
    })
    const tcpp = deriveLigandFactors(hosts, {
      coreMofImport: { records: [...records("Al", "TCPP", 4), ...records("Ti", "BDC", 4), ...records("Fe", "BDC", 4)] },
    })

    expect(tcpp["Al-MOF"].value).not.toBe(bdc["Al-MOF"].value)
    expect(tcpp["Al-MOF"].tuple.derivationLevel).toBe("curated-ligand-descriptor")
    expect(tcpp["Al-MOF"].linkerRows[0].linker).toBe("TCPP")
  })

  it("labels pending or unmapped linkers as fallback with the missing labels", () => {
    const factors = deriveLigandFactors(hosts, {
      coreMofImport: { records: records("Al", "pending", 3) },
    })

    expect(factors["Al-MOF"].value).toBe(0.5)
    expect(factors["Al-MOF"].tuple.derivationLevel).toBe("fallback")
    expect(factors["Al-MOF"].tuple.fallbackReason).toMatch(/pending/)
  })

  it("derives synthesizability from family frequency and decreases when records are removed", () => {
    const baseline = deriveSynthesizabilityFactors(hosts, {
      coreMofImport: {
        records: [
          ...records("Al", "BDC", 12),
          ...records("Ti", "BDC", 6),
          ...records("Fe", "BDC", 2),
        ],
      },
      literatureDataset: { records: [] },
    })
    const reduced = deriveSynthesizabilityFactors(hosts, {
      coreMofImport: {
        records: [
          ...records("Al", "BDC", 3),
          ...records("Ti", "BDC", 6),
          ...records("Fe", "BDC", 2),
        ],
      },
      literatureDataset: { records: [] },
    })

    expect(reduced["Al-MOF"].value).toBeLessThan(baseline["Al-MOF"].value)
    expect(baseline["Ti-MOF"].tuple.derivationLevel).toMatch(/curated-synthesis-difficulty/)
    expect(baseline["Ti-MOF"].tuple.rawAggregate.difficultyMultiplier).toBe(scoringSpec.synthesizability.difficultyOverrides["Ti-MOF"].multiplier)
  })

  it("computes transparent route economics from curated precursor costs", () => {
    expect(metalPrecursorCostTable.version).toBe("V3.9.8")
    expect(Object.fromEntries(metalPrecursorCostTable.records.map(row => [row.metal, row.usdPerKg]))).toEqual(expect.objectContaining({
      Fe: 0.5,
      Al: 3.3,
      Zn: 3.4,
      Cr: 9,
      Ti: 10,
      Cu: 13.5,
      Zr: 35,
      W: 50,
      Co: 56,
      Mo: 65,
    }))
    expect(metalPrecursorCostTable.records.filter(row => ["Al", "Cu", "Zn", "Co"].includes(row.metal)).every(row => row.confidence === "high")).toBe(true)
    expect(metalPrecursorCostTable.records.filter(row => ["Ni", "V", "Mn", "Ce"].includes(row.metal)).every(row => row.dataGrade === "fallback")).toBe(true)
    const routeFactors = deriveEconomicFactors([
      { routeId: "al-mo", hostMof: "Al-MOF", guestMetal: "Mo" },
      { routeId: "al-fe", hostMof: "Al-MOF", guestMetal: "Fe" },
    ], {
      rankedHosts: [{
        displayName: "Al-MOF",
        metalNode: "Al-oxo node",
        synthesizabilityScore: 0.8,
        ligandDescriptorSummary: { meanLigandCostUsdKg: 10 },
      }],
    }, {
      rankedGuestMetals: [{ guestMetal: "Mo" }, { guestMetal: "Fe" }],
    })

    expect(routeFactors["al-fe"].estimatedCost).toBeLessThan(routeFactors["al-mo"].estimatedCost)
    expect(routeFactors["al-fe"].value).toBeGreaterThan(routeFactors["al-mo"].value)
    expect(routeFactors["al-mo"].tuple.derivationLevel).toBe("curated-economic")
    expect(routeFactors["al-mo"].tuple.citations.join(" ")).toMatch(/Fastmarkets\/USGS\/SMM/)
  })
})
