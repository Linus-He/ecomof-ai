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
      "projectEvolution",
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
    expect(resolveTabForHash("project-evolution-roadmap")).toBe("projectEvolution")
    expect(getNavigationItem("gas-separation")?.id).toBe("gassep")
    expect(getScrollTargetForHash("methodology-gassep")).toBe("methodology-gassep")
    expect(getScrollTargetForHash("project-evolution-roadmap")).toBe("project-evolution-roadmap")
  })

  it("registers the first-priority centers and the independent charter as real routes", () => {
    expect(["catalysisLiterature", "organicAcid", "algorithmValidation", "dataQuality", "mofRecord", "literatureRecord", "charter"].every(id => Boolean(NAVIGATION_ROUTES.find(route => route.tabId === id)))).toBe(true)
    expect(getNavigationItem("research-charter")?.tabId).toBe("charter")
    expect(getNavigationItem("data-quality-provenance")?.tabId).toBe("dataQuality")
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
