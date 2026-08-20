import { describe, expect, it } from "vitest"
import {
  HASH_TO_TAB,
  NAVIGATION_DOMAINS,
  NAVIGATION_ITEMS,
  NAVIGATION_ITEM_BY_ID,
  NAVIGATION_ROUTES,
  TAB_TO_HASH,
  getNavigationItem,
  getNavigationMeta,
  getPrimaryNavigationItems,
  getScrollTargetForHash,
  resolveTabForHash,
} from "../../config/navigationRegistry"

describe("navigation registry", () => {
  it("preserves the current first-level navigation during P0", () => {
    expect(getPrimaryNavigationItems().map(item => item.tabId)).toEqual([
      "home",
      "ecoscreen",
      "gassep",
      "catalysis",
      "library",
      "about",
      "dataCompliance",
    ])
  })

  it("gives every registered item a unique id, hash, and bilingual label", () => {
    expect(new Set(NAVIGATION_ITEMS.map(item => item.id)).size).toBe(NAVIGATION_ITEMS.length)
    expect(new Set(NAVIGATION_ITEMS.map(item => item.hash)).size).toBe(NAVIGATION_ITEMS.length)

    for (const item of NAVIGATION_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.hash).toBeTruthy()
      expect(item.label.zh).toBeTruthy()
      expect(item.label.en).toBeTruthy()
    }
  })

  it("keeps route, metadata, and component loading in one record", () => {
    for (const route of NAVIGATION_ROUTES) {
      expect(HASH_TO_TAB[route.hash]).toBe(route.tabId)
      expect(TAB_TO_HASH[route.tabId]).toBe(route.hash)
      expect(getNavigationMeta(route.hash).title).toBeTruthy()
      expect(getNavigationMeta(route.hash).description).toBeTruthy()
      expect(route.component.exportName).toBeTruthy()
      if (route.component.strategy === "lazy") expect(route.component.load).toBeTypeOf("function")
      else expect(route.component.load).toBeUndefined()
    }
  })

  it("resolves legacy aliases and nested scroll targets without duplicating maps", () => {
    expect(resolveTabForHash("gas-separation")).toBe("gassep")
    expect(resolveTabForHash("methodology-gassep")).toBe("about")
    expect(resolveTabForHash("methodology-algorithm-validation")).toBe("algorithmValidation")
    expect(resolveTabForHash("mof-record-coremof2024-csdm-00001")).toBe("mofRecord")
    expect(resolveTabForHash("literature-doi-10.1039%2Fd2ta04485d")).toBe("literatureRecord")
    expect(resolveTabForHash("project-evolution-roadmap")).toBe("researchRoadmap")
    expect(resolveTabForHash("project-evolution-milestones")).toBe("scientificMilestones")
    expect(resolveTabForHash("project-evolution-version-timeline")).toBe("releaseNotes")
    expect(resolveTabForHash("project-evolution-release-notes")).toBe("releaseNotes")
    expect(getNavigationItem("gas-separation")?.id).toBe("gassep")
    expect(getScrollTargetForHash("methodology-gassep")).toBe("methodology-gassep")
    expect(getScrollTargetForHash("project-evolution-roadmap")).toBeNull()
    expect(getScrollTargetForHash("project-evolution-version-timeline")).toBeNull()
  })

  it("registers the first-priority centers and the independent charter as real routes", () => {
    expect(["catalysisLiterature", "organicAcid", "algorithmValidation", "dataQuality", "benchmarkReferences", "mofRecord", "literatureRecord", "charter", "creatorStatement", "releaseNotes", "scientificMilestones", "researchRoadmap", "contact", "acknowledgements"].every(id => Boolean(NAVIGATION_ROUTES.find(route => route.tabId === id)))).toBe(true)
    expect(getNavigationItem("research-charter")?.tabId).toBe("charter")
    expect(getNavigationItem("creator-statement")?.tabId).toBe("creatorStatement")
    expect(getNavigationItem("data-quality-provenance")?.tabId).toBe("dataQuality")
    expect(getNavigationItem("benchmark-references")?.tabId).toBe("benchmarkReferences")
    expect(getNavigationItem("project-evolution-release-notes")?.tabId).toBe("releaseNotes")
    expect(getNavigationItem("project-evolution-milestones")?.tabId).toBe("scientificMilestones")
    expect(getNavigationItem("project-evolution-roadmap")?.tabId).toBe("researchRoadmap")
    expect(getNavigationItem("contact")?.tabId).toBe("contact")
    expect(getNavigationItem("acknowledgements")?.tabId).toBe("acknowledgements")
    expect(NAVIGATION_ITEM_BY_ID["projectEvolution"]).toBeUndefined()
    expect(NAVIGATION_ITEM_BY_ID["project-evolution-version-timeline"]).toBeUndefined()
    expect(NAVIGATION_DOMAINS.find(domain => domain.id === "project")?.groups.flatMap(group => group.itemIds)).not.toContain("project-evolution-version-timeline")
    expect(NAVIGATION_DOMAINS.find(domain => domain.id === "about")?.groups.find(group => group.id === "about-governance")?.itemIds).toContain("creatorStatement")
  })

  it("ensures every future mega-menu group references a registered item", () => {
    for (const domain of NAVIGATION_DOMAINS) {
      expect(domain.label.zh).toBeTruthy()
      expect(domain.label.en).toBeTruthy()
      for (const group of domain.groups) {
        expect(group.label.zh).toBeTruthy()
        expect(group.label.en).toBeTruthy()
        for (const itemId of group.itemIds) expect(NAVIGATION_ITEM_BY_ID[itemId]).toBeTruthy()
      }
    }
  })
})
