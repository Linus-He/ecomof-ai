// @ts-nocheck
// V3.9.1 GasSep summary — derives every GasSep database card from the raw
// adsorption records: counts, gas systems/pairs, condition / capacity /
// selectivity coverage, source-type distribution, provenance coverage, benchmark
// suitability, filter options, and export rows. No hardcoded statistics; missing
// fields fall back cleanly.
import { safeNumber } from "../fallback/safeNumber"
import { safeRatio } from "../fallback/safePercent"

const asArray = (d: any) => (Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : [])
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : null)

// experimental / literature / simulation / inferred buckets from evidence.dataType.
export function classifyGasSourceType(record: any): string {
  const t = String(record?.evidence?.dataType || record?.recordProvenance?.sourceType || "").toLowerCase()
  if (!t) return "unknown"
  if (t.includes("experimental")) return "experimental"
  if (t.includes("simulat") || t.includes("gcmc") || t.includes("iast")) return "simulation"
  if (t.includes("predict") || t.includes("derived") || t.includes("ml")) return "inferred"
  if (t.includes("literature")) return "literature"
  return "unknown"
}

export function buildGasSepSourceDistribution(records: any) {
  const rows = asArray(records)
  const dist: Record<string, number> = { experimental: 0, literature: 0, simulation: 0, inferred: 0, unknown: 0 }
  for (const r of rows) dist[classifyGasSourceType(r)] += 1
  const total = rows.length || 1
  return { counts: dist, shares: Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, Number((v / total).toFixed(3))])) }
}

export function buildGasSepConditionCoverage(records: any) {
  const rows = asArray(records)
  const total = rows.length
  const has = (fn: (r: any) => any) => rows.filter(r => num(fn(r)) != null).length
  const temperature = has(r => r.condition?.temperatureK)
  const pressure = has(r => r.condition?.pressureBar ?? r.condition?.adsorptionPressureBar)
  const capacity = has(r => r.metrics?.workingCapacity ?? r.metrics?.primaryUptake)
  const selectivity = has(r => r.metrics?.selectivity)
  return {
    total,
    temperatureCoverage: safeRatio(temperature, total, 0),
    pressureCoverage: safeRatio(pressure, total, 0),
    capacityCoverage: safeRatio(capacity, total, 0),
    selectivityCoverage: safeRatio(selectivity, total, 0),
    missingConditionCount: rows.filter(r => num(r.condition?.temperatureK) == null || num(r.condition?.pressureBar ?? r.condition?.adsorptionPressureBar) == null).length,
  }
}

export function buildGasSepFilterOptions(records: any) {
  const rows = asArray(records)
  const uniq = (fn: (r: any) => any) => Array.from(new Set(rows.map(fn).filter(Boolean))).sort()
  return {
    gasPair: uniq(r => r.gasPair),
    primaryGas: uniq(r => r.primaryGas),
    applicationScenario: uniq(r => r.applicationScenario),
    sourceType: uniq(r => classifyGasSourceType(r)),
  }
}

export function buildGasSepBenchmarkSuitability(records: any) {
  const rows = asArray(records)
  const total = rows.length
  const suitable = rows.filter(r => num(r.condition?.temperatureK) != null && num(r.condition?.pressureBar ?? r.condition?.adsorptionPressureBar) != null && num(r.metrics?.selectivity) != null && num(r.metrics?.workingCapacity ?? r.metrics?.primaryUptake) != null).length
  return { suitable, total, ratio: safeRatio(suitable, total, 0), notSuitable: total - suitable }
}

export function buildGasSepExportRows(records: any) {
  return asArray(records).map((r: any) => ({
    id: r.id ?? "",
    mof: r.displayName ?? r.rawName ?? "",
    gasPair: r.gasPair ?? "",
    temperatureK: num(r.condition?.temperatureK) ?? "",
    pressureBar: num(r.condition?.pressureBar ?? r.condition?.adsorptionPressureBar) ?? "",
    selectivity: num(r.metrics?.selectivity) ?? "",
    workingCapacity: num(r.metrics?.workingCapacity) ?? "",
    sourceType: classifyGasSourceType(r),
    sourceDatabase: r.recordProvenance?.sourceDatabase ?? "",
    citation: r.recordProvenance?.citation ?? "",
    doi: r.recordProvenance?.doi ?? "",
  }))
}

export function buildGasSepSummary({ records, dataVersion = "V3.9.1", generatedAt = "" }: any = {}) {
  const rows = asArray(records)
  const coverage = buildGasSepConditionCoverage(rows)
  const distribution = buildGasSepSourceDistribution(rows)
  const benchmark = buildGasSepBenchmarkSuitability(rows)
  const provenanceCount = rows.filter((r: any) => Boolean(r.recordProvenance?.sourceDatabase) || Boolean(r.recordProvenance?.citation)).length

  return {
    summaryId: "gassep-summary-v1",
    generatedAt: generatedAt || new Date().toISOString(),
    dataVersion,
    dataMode: rows.length ? "mixed" : "demo",
    adsorptionRecordCount: rows.length,
    gasSystemCount: new Set(rows.map((r: any) => r.gasPair).filter(Boolean)).size,
    gasPairCount: new Set(rows.map((r: any) => r.gasPair).filter(Boolean)).size,
    applicationScenarioCount: new Set(rows.map((r: any) => r.applicationScenario).filter(Boolean)).size,
    conditionCoverage: coverage,
    sourceTypeDistribution: distribution,
    benchmarkSuitability: benchmark,
    provenanceCoverage: safeRatio(provenanceCount, rows.length, 0),
    chartDataAvailable: rows.some((r: any) => Number.isFinite(Number(r.metrics?.selectivity))),
    filterOptions: buildGasSepFilterOptions(rows),
    filteredResultCount: rows.length,
  }
}

export default buildGasSepSummary
