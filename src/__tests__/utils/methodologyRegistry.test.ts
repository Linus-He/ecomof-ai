// @ts-nocheck
import fs from "node:fs"
import { describe, expect, it } from "vitest"
import modules from "../../../public/data/methodology_modules_demo.json"
import literature from "../../../public/data/methodology_literature_inspiration_records.json"
import governance from "../../../public/data/methodology_governance_frameworks.json"
import { buildMethodologyRegistry } from "../../utils/methodologyRegistry"

describe("methodology registry", () => {
  it("derives method coverage from the existing source data without changing it", () => {
    const snapshot = JSON.stringify(modules)
    const registry = buildMethodologyRegistry(modules, literature)

    expect(registry.metrics).toMatchObject({
      moduleCount: 8,
      groupCount: 19,
      formulaCount: 33,
      referenceCount: 20,
      limitationCount: 37,
      sourceCount: literature.sources.length,
    })
    expect(registry.cards.map(card => card.id)).toEqual(modules.map(module => module.id))
    expect(registry.cards.every(card => card.methodHash === `methodology-${card.id}`)).toBe(true)
    expect(registry.cards.every(card => card.functionHash && card.databaseLabelZh)).toBe(true)
    expect(JSON.stringify(modules)).toBe(snapshot)
  })

  it("keeps official method frameworks separate from material-performance literature", () => {
    expect(governance.standardFields).toHaveLength(10)
    expect(governance.frameworks).toHaveLength(4)
    expect(governance.frameworks.every(record => record.url.startsWith("https://"))).toBe(true)
    expect(governance.frameworks.every(record => record.verificationStatus.includes("verified"))).toBe(true)
    expect(governance.frameworks.find(record => record.id === "nist-ai-rmf")?.doi).toBe("10.6028/NIST.AI.100-1")
    expect(governance.frameworks.filter(record => record.doi === null).every(record => record.sourceType === "official_documentation")).toBe(true)
  })

  it("retains the complete methodology render chain below the registry", () => {
    const source = fs.readFileSync("src/components/tabs/MethodsLimitationsTab.tsx", "utf8")
    expect(source).toContain("<MethodologyRegistry")
    expect(source).toContain("<MethodModuleSection")
    expect(source).toContain("<MethodArchitectureDetails")
    expect(source).toContain("<CurrentOrganicAcidMethodology")
    expect(source).toContain("<LiteratureInspirationSection")
  })
})
