import { describe, expect, it } from "vitest"
import log from "../../../public/data/app_release_log.json"

describe("app_release_log unified version source", () => {
  it("defines a single current Web version with v1.0.0 as the first unified release", () => {
    expect(log.currentAppVersion).toBe("v1.0.13")
    expect(log.releases.length).toBeGreaterThanOrEqual(1)
    // releases are newest-first; v1.0.0 remains the first unified platform release
    expect(log.releases[0].appVersion).toBe("v1.0.13")
    expect(log.releases.map(r => r.appVersion)).toContain("v1.0.1")
    expect(log.releases.map(r => r.appVersion)).toContain("v1.0.0")
    expect(log.authority).toMatch(/single unified/i)
  })

  it("records the current and four previously missing recent releases with concrete module changes", () => {
    const recent = ["v1.0.13", "v1.0.12", "v1.0.11", "v1.0.10", "v1.0.9", "v1.0.8", "v1.0.7", "v1.0.6"]
      .map(version => log.releases.find(row => row.appVersion === version))
    expect(recent.every(Boolean)).toBe(true)
    for (const release of recent) {
      expect(Object.keys(release.modules).length).toBeGreaterThanOrEqual(3)
      for (const module of Object.values(release.modules)) {
        expect(module.summary.zh).toBeTruthy()
        expect(module.summary.en).toBeTruthy()
        expect(module.changes.length).toBeGreaterThanOrEqual(3)
      }
    }
    expect(JSON.stringify(recent[0])).toMatch(/34|紧凑小圆角|literature/)
    expect(JSON.stringify(recent[1])).toMatch(/43|CRITIC|IAST|编号/)
    expect(JSON.stringify(recent[2])).toMatch(/185|MOF Anatomy|V3\.9\.10/)
    expect(JSON.stringify(recent[3])).toMatch(/37,452|3,451|9,835/)
    expect(JSON.stringify(recent[4])).toMatch(/43|10|96/)
    expect(JSON.stringify(recent[5])).toMatch(/HGCPS|合规/)
    expect(JSON.stringify(recent[6])).toMatch(/9,835|FAIR-MOFs|CSD/)
    expect(JSON.stringify(recent[7])).toMatch(/IAST|等量吸附热|isosteric/)
  })

  it("v1.0.5 archives material-level evaluation, readable MOF names, and formula alignment", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.5")
    expect(Object.keys(release.modules)).toEqual([
      "ui",
      "ecoScreen",
      "gasSep",
      "database",
      "methodsEvidence",
      "projectEvolution",
    ])
    expect(JSON.stringify(release.modules.ui)).toMatch(/确认|Confirm/)
    expect(JSON.stringify(release.modules.ecoScreen)).toMatch(/1 t CO2|1 t CO₂|生命周期/)
    expect(JSON.stringify(release.modules.gasSep)).toMatch(/IAST|single-point|单点/)
    expect(JSON.stringify(release.modules.database)).toMatch(/数据库编号|raw database identifiers/)
    expect(JSON.stringify(release.modules.methodsEvidence)).toMatch(/CRITIC|Spearman|公式/)
    expect(JSON.stringify(release.modules.projectEvolution)).toMatch(/zt,j|z_t,j/)
  })

  it("v1.0.4 archives the homepage scientific narrative and integrated research routes", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.4")
    expect(Object.keys(release.modules)).toEqual(["ui"])
    expect(JSON.stringify(release.modules.ui)).toMatch(/Pareto|多目标/)
    expect(JSON.stringify(release.modules.ui)).toMatch(/严格改进|strict-improvement/)
    expect(JSON.stringify(release.modules.ui)).toMatch(/研究路径|research-route/)
    expect(JSON.stringify(release.modules.ui)).toMatch(/浅色|深色|light|dark/)
  })

  it("v1.0.3 archives the completed EcoScreen, Project Evolution, homepage, and navigation work", () => {
    const release = log.releases.find(row => row.appVersion === "v1.0.3")
    expect(Object.keys(release.modules)).toEqual(["ui", "ecoScreen", "methodsEvidence", "projectEvolution"])
    expect(JSON.stringify(release.modules.ui)).toMatch(/MOF descriptor|描述符三维分布/)
    expect(JSON.stringify(release.modules.ui)).toMatch(/equal-width|等宽/)
    expect(JSON.stringify(release.modules.ecoScreen)).toMatch(/FAIR-MOFs|4,168|regional baselines|地域基线/)
    expect(JSON.stringify(release.modules.ecoScreen)).toMatch(/economics|经济分析|hard-gate|硬门控/)
    expect(JSON.stringify(release.modules.methodsEvidence)).toMatch(/Literature Inspiration Sources|文献灵感来源/)
    expect(JSON.stringify(release.modules.projectEvolution)).toMatch(/completed|已完成/)
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

  it("records completed work in the current concrete patch developer log", () => {
    expect(log.currentAppVersion).toBe("v1.0.13")
    expect(log.developmentLog.baseAppVersion).toBe("v1.0.12")
    expect(log.developmentLog.developmentVersion).toBe("v1.0.13")
    expect(log.developmentLog.status).toBe("archived")
    expect(log.developmentLog.logPolicy.zh).toMatch(/实际完成并通过检查/)
    expect(Object.keys(log.developmentLog.modules)).toEqual([
      "ui",
      "validation",
      "projectEvolution",
    ])
    expect(JSON.stringify(log.developmentLog.modules.validation)).toMatch(/执行|来源|algorithm/)
    expect(JSON.stringify(log.developmentLog.modules.ui)).toMatch(/6 px|首页|compact-corner/)
    expect(JSON.stringify(log.developmentLog.modules.projectEvolution)).toMatch(/v1\.0\.13|本地提交/)
    expect(JSON.stringify(log.developmentLog)).not.toMatch(/下一版更新预告|Next Release Preview|待发布|pending release/)
  })
})
