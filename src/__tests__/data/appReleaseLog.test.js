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

  it("v1.0.2 appends a ui-module update (font, version, 3D, Pareto polish)", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.2")
    expect(Object.keys(release.modules)).toEqual(["ui"])
    expect(release.modules.ui.changes.length).toBeGreaterThan(0)
    expect(JSON.stringify(release.modules.ui)).toMatch(/Pareto|帕累托/)
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
})
