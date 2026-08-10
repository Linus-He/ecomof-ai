// @ts-nocheck
import { describe, expect, it } from "vitest"
import dataset from "../../../public/data/catalysis_reaction_records_v1.json"
import {
  buildCatalysisReactionRecordRows,
  buildCatalysisReactionSummary,
  buildFaradaicEfficiencyRows,
  filterCatalysisReactionRows,
} from "../../utils/catalysisReactionRecords"

describe("catalysis reaction record view model", () => {
  const rows = buildCatalysisReactionRecordRows(dataset, "zh")

  it("derives the published audit totals without creating synthetic metrics", () => {
    expect(rows).toHaveLength(10)
    expect(buildCatalysisReactionSummary(dataset, rows)).toMatchObject({
      sourceCount: 10,
      recordCount: 10,
      numericMetricCount: 26,
      notExtractedMetricCount: 2,
      rankingEligibleCount: 0,
      identityLinkedCount: 0,
    })
  })

  it("recovers metric-level conditions without promoting them to record-level claims", () => {
    const mfm220 = rows.find(row => row.catalyst === "MFM-220-p")
    const biHhtp = rows.find(row => row.catalyst === "Bi-HHTP")
    const tal33 = rows.find(row => row.catalyst.includes("TAL-33"))

    expect(mfm220.conditionCoverage.potential).toMatchObject({
      available: true,
      inferredFromMetric: false,
      value: -1.1,
    })
    expect(biHhtp.conditionCoverage.potential).toMatchObject({
      available: true,
      inferredFromMetric: true,
      value: -0.7,
    })
    expect(biHhtp.conditions.potentialVsRheV).toBeNull()
    expect(tal33.conditionCoverage.potential.available).toBe(false)
    expect(tal33.numericMetricCount).toBe(0)
  })

  it("filters identity, evidence, missing-condition, and text fields from one shared model", () => {
    expect(filterCatalysisReactionRows(rows, { identityStatus: "derived-material-only" })).toHaveLength(5)
    expect(filterCatalysisReactionRows(rows, { coverage: "has-in-situ" }).map(row => row.catalyst)).toEqual(expect.arrayContaining([
      "MFM-220-p",
      "Bi-HHTP",
      "MOF-derived CuBi catalyst",
    ]))
    expect(filterCatalysisReactionRows(rows, { coverage: "missing-critical" }).length).toBeGreaterThan(0)
    expect(filterCatalysisReactionRows(rows, { search: "10.1039/D3SC01876H" }).map(row => row.catalyst)).toEqual(["Bi-HHTP"])
  })

  it("keeps source-reported FE rows in year/source order instead of value rank order", () => {
    const feRows = buildFaradaicEfficiencyRows(rows)
    const descendingValues = [...feRows].sort((a, b) => b.value - a.value).map(row => row.value)

    expect(feRows).toHaveLength(10)
    expect(feRows.map(row => row.year)).toEqual([...feRows.map(row => row.year)].sort((a, b) => a - b))
    expect(feRows.map(row => row.value)).not.toEqual(descendingValues)
    expect(feRows.every(row => row.doi && row.conditionLabelZh)).toBe(true)
  })
})
