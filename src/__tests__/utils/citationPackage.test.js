import { describe, expect, it } from "vitest"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import { buildCitationPackage } from "../../utils/researchReports"

describe("citation package", () => {
  it("collects citation sources, data sources, field sources, source links, and citation status", () => {
    const citationPackage = buildCitationPackage({ records, summary, limit: 8 })

    expect(citationPackage.title).toBe("引用包")
    expect(citationPackage.citationReadyCount).toBe(summary.citationReadyCandidates)
    expect(citationPackage.sourceConfirmedCount).toBe(summary.sourceConfirmedCandidates)
    expect(citationPackage.entries.length).toBeGreaterThan(0)
    expect(citationPackage.fieldSources.length).toBeGreaterThan(0)

    const entry = citationPackage.entries[0]
    expect(entry.citationSource).toBeTruthy()
    expect(entry.dataSource).toBeTruthy()
    expect(entry.sourceRecordId).toBeTruthy()
    expect(entry.sourceUrl).toMatch(/^https?:\/\//)
    expect(entry.citationStatus).toBe("引文已就绪")

    const fieldSource = citationPackage.fieldSources.find(row => row.field === "surfaceArea")
    expect(fieldSource).toEqual(expect.objectContaining({
      field: "surfaceArea",
      sourceDatabase: expect.any(String),
      sourceRecordId: expect.any(String),
      sourceUrl: expect.any(String),
      citation: expect.any(String),
      license: expect.any(String),
    }))
  })
})
