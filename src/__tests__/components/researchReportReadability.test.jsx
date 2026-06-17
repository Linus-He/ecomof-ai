import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { generateResearchReport } from "../../utils/researchReports"

describe("researchReportReadability", () => {
  it("builds a natural-language research report rather than a JSON panel", () => {
    const report = generateResearchReport({ type: "screening", records, summary, versionData, performancePriorityMode: "performance_first" })

    expect(report.executiveSummary).toMatch(/本次筛选基于/)
    expect(report.sections.map(section => section.title)).toEqual(expect.arrayContaining([
      "执行摘要",
      "研究问题",
      "筛选设置",
      "数据库快照",
      "筛选优先级",
      "优先候选摘要",
      "排序解释",
      "证据与溯源",
      "数据缺口",
      "验证就绪度",
      "已知局限",
      "下一步建议",
    ]))
    expect(report.markdown).not.toMatch(/^\s*\{[\s\S]*\}\s*$/)
    expect(report.markdown).toMatch(/不是 Verified Screening|不是最终推荐/)
  })
})
