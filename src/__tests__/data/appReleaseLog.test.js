import { describe, expect, it } from "vitest"
import log from "../../../public/data/app_release_log.json"

describe("app_release_log unified version source", () => {
  it("defines a single current App version with v1.0.0 as the first unified release", () => {
    expect(log.currentAppVersion).toBe("v1.0.2")
    expect(log.releases.length).toBeGreaterThanOrEqual(1)
    // releases are newest-first; v1.0.0 remains the first unified platform release
    expect(log.releases[0].appVersion).toBe("v1.0.2")
    expect(log.releases.map(r => r.appVersion)).toContain("v1.0.1")
    expect(log.releases.map(r => r.appVersion)).toContain("v1.0.0")
    expect(log.authority).toMatch(/single unified/i)
  })

  it("v1.0.2 records ui, GasSep, and MOF Library updates without renumbering module history", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.2")
    expect(Object.keys(release.modules)).toEqual(["ui", "gasSep", "database"])
    expect(release.modules.ui.changes.length).toBeGreaterThan(0)
    expect(release.modules.gasSep.changes.length).toBeGreaterThan(0)
    expect(release.modules.database.changes.length).toBeGreaterThan(0)
    expect(JSON.stringify(release.modules.ui)).toMatch(/Pareto|帕累托/)
    expect(JSON.stringify(release.modules.gasSep)).toMatch(/CRITIC|APS|GasScore/)
    expect(JSON.stringify(release.modules.gasSep)).toMatch(/Chinese\/English|light\/dark|mobile|中英文|深浅色|移动端/)
    expect(JSON.stringify(release.modules.database)).toMatch(/MOF Library|候选库|结构|identity/)
  })

  it("v1.0.0 release only lists modules it changed, each with a summary and changes", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.0")
    const moduleKeys = Object.keys(release.modules)
    expect(moduleKeys).toEqual(expect.arrayContaining(["organicAcid", "gasSep", "database", "validation", "ui"]))
    for (const key of moduleKeys) {
      const mod = release.modules[key]
      expect(mod.summary.zh).toBeTruthy()
      expect(mod.summary.en).toBeTruthy()
      expect(Array.isArray(mod.changes)).toBe(true)
      expect(mod.changes.length).toBeGreaterThan(0)
    }
  })

  it("preserves pre-1.0 history regrouped by module without renumbering", () => {
    expect(log.history.byModule.organicAcid.length).toBeGreaterThan(0)
    expect(log.history.byModule.database.length).toBeGreaterThan(0)
    // Original module version numbers are preserved verbatim (not renumbered to 1.x).
    const allVersions = Object.values(log.history.byModule).flat().map(row => row.version)
    expect(allVersions).toContain("V3.10.1")
    // History keeps original labels (V1.0, V2.x, V3.x); nothing was renumbered to the unified app version.
    expect(allVersions).not.toContain("v1.0.0")
  })

  it("records honest provenance derived from version_evolution_records", () => {
    expect(log.provenance.derivedFrom).toMatch(/version_evolution_records/)
    expect(log.provenance.generatingScript).toMatch(/build-app-release-log/)
  })

  it("keeps this round in a pending next-release draft until submission", () => {
    expect(log.currentAppVersion).toBe("v1.0.2")
    expect(log.pendingNextRelease.baseAppVersion).toBe("v1.0.2")
    expect(log.pendingNextRelease.versionPolicy.zh).toMatch(/发布时确认/)
    expect(Object.keys(log.pendingNextRelease.modules)).toEqual(expect.arrayContaining(["home", "ecoscreen", "projectEvolution", "navigation", "localization"]))
    expect(JSON.stringify(log.pendingNextRelease.modules.ecoscreen)).toMatch(/文献依据|literature basis|金属成本/)
    expect(JSON.stringify(log.pendingNextRelease.modules.localization)).toMatch(/开发者文档|developer-documentation/)
  })
})
