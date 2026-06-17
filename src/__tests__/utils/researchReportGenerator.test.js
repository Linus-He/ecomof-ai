import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { generateResearchReport, REPORT_TYPES } from "../../utils/researchReports"

describe("research report generator", () => {
  it("generates every required report type with mandatory research sections", () => {
    for (const type of REPORT_TYPES.map(row => row.id)) {
      const report = generateResearchReport({ type, records, summary, versionData, timestamp: "2026-06-17T08:00:00.000Z" })

      expect(report.title).toMatch(/报告/)
      expect(report.snapshot.databaseVersion).toBe(summary.version)
      expect(report.sections.map(section => section.title)).toEqual(expect.arrayContaining(report.requiredSections))
      expect(report.markdown).toMatch(/研究目标/)
      expect(report.markdown).toMatch(/数据库版本/)
      expect(report.markdown).toMatch(/CRITIC权重/)
      expect(report.markdown).toMatch(/字段来源/)
      expect(report.markdown).toMatch(/局限性/)
      expect(report.markdown).toMatch(/不是 Verified Screening|不是最终推荐/)
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
