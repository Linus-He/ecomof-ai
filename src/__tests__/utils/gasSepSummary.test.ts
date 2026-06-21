// @ts-nocheck
import { describe, expect, it } from "vitest"
import gasData from "../../../public/data/gas_adsorption_records_v1.json"
import {
  buildGasSepSummary, buildGasSepFilterOptions, buildGasSepSourceDistribution,
  buildGasSepConditionCoverage, buildGasSepBenchmarkSuitability, buildGasSepExportRows, classifyGasSourceType,
} from "../../utils/summary/buildGasSepSummary"

const records = Array.isArray(gasData) ? gasData : gasData.records

describe("V3.9.1 GasSep summary", () => {
  it("derives counts/coverage/distribution from the real records", () => {
    const s = buildGasSepSummary({ records })
    expect(s.adsorptionRecordCount).toBe(records.length)
    expect(s.gasPairCount).toBeGreaterThan(0)
    expect(s.conditionCoverage.temperatureCoverage).toBeGreaterThan(0)
    expect(s.generatedAt).toBeTruthy()
    expect(s.dataVersion).toBe("V3.9.1")
  })

  it("recomputes when an adsorption record is added", () => {
    const before = buildGasSepSummary({ records }).adsorptionRecordCount
    const after = buildGasSepSummary({ records: [...records, { gasPair: "NEW/GAS", condition: { temperatureK: 300, pressureBar: 2 }, metrics: { selectivity: 5, workingCapacity: 1 }, evidence: { dataType: "experimental_literature_seed" } }] })
    expect(after.adsorptionRecordCount).toBe(before + 1)
    expect(after.filterOptions.gasPair).toContain("NEW/GAS")
  })

  it("filter options grow when a new gas pair / source type appears", () => {
    const opts = buildGasSepFilterOptions([...records, { gasPair: "KR/XE2", evidence: { dataType: "simulated_gcmc" } }])
    expect(opts.gasPair).toContain("KR/XE2")
    expect(opts.sourceType).toContain("simulation")
  })

  it("shows fallback coverage when temperature / pressure are missing", () => {
    const cov = buildGasSepConditionCoverage([{ gasPair: "A/B", condition: {}, metrics: {} }])
    expect(cov.temperatureCoverage).toBe(0)
    expect(cov.pressureCoverage).toBe(0)
    expect(cov.missingConditionCount).toBe(1)
  })

  it("recomputes the source-type distribution", () => {
    const dist = buildGasSepSourceDistribution([{ evidence: { dataType: "experimental_literature_seed" } }, { evidence: { dataType: "simulated_iast" } }, { evidence: { dataType: "predicted_ml" } }])
    expect(dist.counts.experimental).toBe(1)
    expect(dist.counts.simulation).toBe(1)
    expect(dist.counts.inferred).toBe(1)
    expect(classifyGasSourceType({ evidence: { dataType: "literature_seed" } })).toBe("literature")
  })

  it("export rows carry provenance and no undefined/null/NaN", () => {
    const rows = buildGasSepExportRows(records)
    expect(rows.length).toBe(records.length)
    const joined = JSON.stringify(rows)
    expect(joined).not.toMatch(/undefined|NaN/)
    expect(rows[0]).toHaveProperty("sourceDatabase")
    expect(rows[0]).toHaveProperty("citation")
  })

  it("computes benchmark suitability", () => {
    const b = buildGasSepBenchmarkSuitability(records)
    expect(b.total).toBe(records.length)
    expect(b.suitable + b.notSuitable).toBe(records.length)
  })
})
