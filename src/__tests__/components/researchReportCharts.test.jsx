import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { generateResearchReport } from "../../utils/researchReports"

describe("researchReportCharts", () => {
  it("includes the required Chinese chart titles and axes", () => {
    const report = generateResearchReport({ type: "candidate", records, summary, versionData })
    const titles = report.charts.map(chart => chart.title)

    expect(titles).toEqual(expect.arrayContaining(["候选排序图", "数据质量摘要图", "优先级影响图", "溯源覆盖图", "验证就绪度图"]))
    for (const chart of report.charts) {
      expect(chart.xAxis).toBeTruthy()
      expect(chart.yAxis).toBeTruthy()
      expect(chart.legend).toBeTruthy()
      expect(chart.rows.length).toBeGreaterThan(0)
    }
  })
})
