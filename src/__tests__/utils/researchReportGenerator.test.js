import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { generateResearchReport, REPORT_TYPES } from "../../utils/researchReports"

describe("research report generator", () => {
  it("generates every required report type with mandatory research sections", () => {
    for (const type of REPORT_TYPES.map(row => row.id).filter(type => type !== "organic_acid")) {
      const report = generateResearchReport({ type, records, summary, versionData, timestamp: "2026-06-17T08:00:00.000Z" })

      expect(report.title).toMatch(/报告/)
      expect(report.snapshot.databaseVersion).toBe(summary.version)
      expect(report.sections.map(section => section.title)).toEqual(expect.arrayContaining(report.requiredSections))
      expect(report.markdown).toMatch(/执行摘要/)
      expect(report.markdown).toMatch(/数据库快照/)
      expect(report.markdown).toMatch(/筛选优先级/)
      expect(report.markdown).toMatch(/证据与溯源/)
      expect(report.markdown).toMatch(/已知局限/)
      expect(report.markdown).toMatch(/不是 Verified Screening|不是最终推荐/)
      expect(report.charts.map(chart => chart.title)).toEqual(expect.arrayContaining(["候选排序图", "数据质量摘要图", "优先级影响图", "溯源覆盖图", "验证就绪度图"]))
    }
  })

  it("carries field-level provenance into the report", () => {
    const report = generateResearchReport({ type: "candidate", records, summary, versionData, candidateId: records[0].candidateId })

    for (const field of ["surfaceArea", "poreSizeA", "density", "bandGap"]) {
      const source = report.fieldSources.find(row => row.field === field)
      expect(source).toBeTruthy()
      expect(source.sourceDatabase).toBeTruthy()
      expect(source.sourceRecordId).toBeTruthy()
      expect(source.sourceUrl).toBeTruthy()
      expect(source.citation).toBeTruthy()
      expect(source.license).toBeTruthy()
    }
  })
})
