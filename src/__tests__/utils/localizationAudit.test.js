import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { assertLocalizationAuditPass, buildLocalizationGapReport, runLocalizationAudit, LOCALIZATION_AUDIT_MODULES } from "../../utils/localizationAudit"

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("localization audit", () => {
  it("passes V2.4 research-output copy and reports required audit metrics", () => {
    const audit = runLocalizationAudit({
      corpus: [
        "排序解释 查看筛选依据 查看字段来源 查看数据缺口 查看验证状态 查看研究报告",
        "研究报告 运行快照 引用包 汉化质量审计 数据库预览 已核验元数据",
      ],
    })

    expect(audit.localizationCoverage).toBe(1)
    expect(audit.terminologyConsistency).toBe(true)
    expect(audit.scientificLanguageConsistency).toBe(true)
    expect(assertLocalizationAuditPass(audit)).toBe(true)
    expect(audit.preferredActions).toEqual(expect.arrayContaining(["查看筛选依据", "查看字段来源", "查看研究报告"]))
  })

  it("keeps legacy product and ranking-explanation copy out of primary runtime surfaces", () => {
    const corpus = [
      read("src/components/scoring/WhyThisResultButton.tsx"),
      read("src/components/scoring/ScoreExplanationDrawer.tsx"),
      read("src/components/tabs/GasSepTab.tsx"),
      read("src/components/home/workflowData.js"),
      read("src/components/tabs/ResearchReportsTab.jsx"),
      read("public/data/methodology_modules_demo.json"),
    ].join("\n")

    expect(corpus).not.toMatch(/为什么是这个结果|为什么推荐|为什么排名高|为什么推荐该 MOF|为什么推荐这个 MOF/)
    expect(corpus).not.toMatch(/点击这里|查看详情|开始使用|Get Started|Start using|View Details/)
  })

  it("covers all first-level modules for the V2.4 localization audit", () => {
    expect(LOCALIZATION_AUDIT_MODULES).toEqual(expect.arrayContaining([
      "Methods & Evidence", "Project Evolution", "Research Reports", "EcoScreen",
      "MOF Library", "GasSep", "Catalysis Lab", "Model Validation Lab",
      "Data Quality Audit", "Roadmap", "Milestones", "Release Notes", "Version Timeline",
    ]))
  })

  it("builds a localization gap report and flags untranslated / mixed / deprecated items", () => {
    const clean = buildLocalizationGapReport({ corpus: ["排序解释", "已核验元数据", "数据库预览"] })
    expect(clean.untranslatedItems).toEqual([])
    expect(clean.mixedLanguageItems).toEqual([])
    expect(clean.deprecatedTerms).toEqual([])
    expect(clean.clean).toBe(true)
    expect(clean.modules.length).toBeGreaterThanOrEqual(13)

    const dirty = buildLocalizationGapReport({ corpus: ["Project Evolution Center", "运行追踪 是 Screening Trace 的旧译"] })
    expect(dirty.untranslatedItems).toContain("Project Evolution Center")
    expect(dirty.deprecatedTerms.some(row => row.deprecated === "运行追踪")).toBe(true)
    expect(dirty.clean).toBe(false)
    expect(dirty.notFinalRecommendation).toBe(true)
  })

  it("does not flag intentional English (Database Preview / Not Final Recommendation)", () => {
    const report = buildLocalizationGapReport({ corpus: ["Database Preview", "Not Final Recommendation", "GitHub Stars"] })
    expect(report.untranslatedItems).toEqual([])
  })
})
