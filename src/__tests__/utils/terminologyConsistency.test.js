import { describe, expect, it } from "vitest"
import terminologyCn from "../../i18n/terminology_cn.json"
import terminologyEn from "../../i18n/terminology_en.json"
import translationRules from "../../i18n/translation_rules.json"
import { findDuplicateTranslations, terminologyPairs } from "../../utils/localizationAudit"

describe("terminology consistency", () => {
  it("keeps one canonical Chinese translation per required research term", () => {
    expect(findDuplicateTranslations(terminologyCn)).toEqual([])
    const terms = Object.fromEntries(terminologyPairs().map(row => [row.en, row.zh]))

    expect(terms["Screening Trace"]).toBe("筛选流程追踪")
    expect(terms["Ranking Explanation"]).toBe("排序解释")
    expect(terms["Field Provenance"]).toBe("字段级溯源")
    expect(terms["Database Preview"]).toBe("数据库预览")
    expect(terms["Verified Metadata"]).toBe("已核验元数据")
    expect(terms["Research Report"]).toBe("研究报告")
    expect(terms["Research Readiness"]).toBe("研究成熟度")
  })

  it("keeps English and Chinese terminology keys aligned", () => {
    expect(Object.keys(terminologyEn).sort()).toEqual(Object.keys(terminologyCn).sort())
    expect(translationRules.canonicalTranslations["Why This Result"]).toBe("排序解释")
    expect(translationRules.scientificLanguageGuide.preferredActions).toEqual(expect.arrayContaining([
      "查看筛选依据",
      "查看字段来源",
      "查看数据缺口",
      "查看验证状态",
      "查看排序解释",
      "查看研究报告",
    ]))
  })
})
