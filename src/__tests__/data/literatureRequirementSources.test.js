import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import literature from "../../../public/data/methodology_literature_inspiration_records.json"
import requirements from "../../../public/data/ecoscreen_literature_requirements.json"

function readRepoFile(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

describe("methodology literature inspiration and EcoScreen requirements", () => {
  it("restores the original literature inspiration records and groups this round's sources", () => {
    const sourceIds = new Set(literature.sources.map(source => source.id))
    const originalIds = [
      "LIT-CHE-2026-CBM-FINGERPRINT",
      "LIT-GU-2025-BUTANE-AI-MOF",
      "LIT-HOTSPOT-2025-NATCOMM",
      "LIT-KRIVOBOKOVA-2026-HTE-STRUCTURED-DATA",
      "LIT-SU-2025-MOF-BORYLATION",
    ]

    expect(literature.status).toBe("method-inspiration-only")
    expect(originalIds.every(id => sourceIds.has(id))).toBe(true)
    expect(literature.categories.map(category => category.id)).toEqual([
      "platform-method",
      "ecoscreen-sustainability",
      "gassep-process",
      "mof-library-data",
      "organic-acid-catalysis",
      "data-quality-validation",
    ])
    expect([...sourceIds]).toEqual(expect.arrayContaining([
      "LIT-CRITIC-1995",
      "LIT-WILMER-2012-MOF-SCREENING",
      "LIT-BAE-SNURR-2011-CO2",
      "LIT-BURTCH-2014-WATER-STABILITY",
      "LIT-GREEN-MOF-SYNTHESIS-2020",
      "LIT-LCA-MOF-2017",
      "LIT-SUSTAINABLE-MOF-CCS-2021",
      "LIT-CORE-MOF-2014",
      "LIT-QMOF-2021",
      "LIT-FURUKAWA-2013-MOF-CHEMISTRY",
      "LIT-SUMIDA-2012-CO2-MOF",
      "LIT-BOYD-2019-WET-FLUE",
      "LIT-LEE-2009-MOF-CATALYSIS",
      "LIT-AHNEMAN-2018-REACTION-ML",
      "LIT-FAIR-2016",
      "LIT-MYERS-PRAUSNITZ-1965-IAST",
      "REF-NIST-ADSORPTION-DATA",
      "LIT-CORE-MOF-2019",
      "LIT-FAIR-MOFS-2025-PREPRINT",
      "LIT-FIROUZJAEI-2026-INDUSTRIAL-MOF-LCA",
      "LIT-LAYERED-MOF-LCA-2026",
      "STD-ISO-14040-14044",
      "STD-USGS-EU-CRITICAL-MATERIALS",
    ]))
    expect(literature.sources.filter(source => source.status === "validated_literature").length).toBeGreaterThanOrEqual(14)
    expect(literature.sources.find(source => source.id === "LIT-FAIR-MOFS-2025-PREPRINT")?.status).toBe("preprint_unreviewed")
  })

  it("keeps requirement basis IDs connected to the literature source registry", () => {
    const sourceIds = new Set(literature.sources.map(source => source.id))
    const requirementIds = requirements.requirements.map(requirement => requirement.id)

    expect(requirements.status).toBe("screening-requirement-model")
    expect(requirementIds).toEqual([
      "adsorption-process-metrics",
      "regeneration-energy",
      "water-and-operational-stability",
      "green-synthesis-and-lca",
      "metal-supply-and-toxicity",
      "provenance-and-validation",
      "organic-acid-extension",
    ])
    for (const requirement of requirements.requirements) {
      expect(requirement.requiredFields.length).toBeGreaterThan(0)
      expect(requirement.basisSourceIds.every(id => sourceIds.has(id))).toBe(true)
      expect(requirement.basisLabelZh).toBeTruthy()
      expect(requirement.basisLabelEn).toBeTruthy()
    }
  })

  it("restores literature inspiration without retired validation surfaces and connects the EcoScreen matrix", () => {
    const methodsSource = readRepoFile("src/components/tabs/MethodsLimitationsTab.tsx")
    const ecoSource = readRepoFile("src/components/tabs/EcoScreenTab.tsx")

    expect(methodsSource).toContain('fetchDataJson("methodology_literature_inspiration_records.json"')
    expect(methodsSource).toContain("<LiteratureInspirationSection")
    expect(methodsSource).toContain("buildLiteratureDirectory")
    expect(methodsSource).not.toContain("ALGORITHM_VALIDATION_DIRECTORY")
    expect(methodsSource).not.toContain("<AlgorithmValidationCenter")
    expect(methodsSource).toContain("<CurrentOrganicAcidMethodology")
    expect(ecoSource).toContain('fetchDataJson("ecoscreen_literature_requirements.json", null)')
    expect(ecoSource).toContain('data-testid="ecoscreen-requirement-matrix"')
    expect(ecoSource).toContain("buildEcoScreenRequirementModel")
    expect(ecoSource).toContain("basisLabelZh")
  })
})
