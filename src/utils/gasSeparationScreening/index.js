// @ts-nocheck
import { rankGasCandidates } from "../gasScoring"
import { rankCapacityRecords } from "../gasCapacityRanking"

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function getParetoFrontier(rows = [], xKey = "workingCapacity", yKey = "selectivity") {
  const metricValue = (row, key) => key === "selectivity"
    ? finite(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity)
    : finite(row[key] ?? row.metrics?.[key])
  const points = rows
    .map(row => ({ row, x: metricValue(row, xKey), y: metricValue(row, yKey) }))
    .filter(point => point.x !== null && point.y !== null)
  return points
    .filter(point => !points.some(other => (
      other !== point &&
      other.x >= point.x &&
      other.y >= point.y &&
      (other.x > point.x || other.y > point.y)
    )))
    .sort((a, b) => a.x - b.x)
    .map(point => point.row)
}

export function summarizeGasScreeningCoverage(records = [], scenario = {}) {
  const gasPair = String(scenario.gasPair || "").toUpperCase()
  const rows = records.filter(record => !gasPair || String(record.gasPair || "").toUpperCase() === gasPair)
  const gradeCounts = rows.reduce((acc, record) => {
    const grade = record.dataGrade || record.evidence?.dataGrade || "unknown"
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})
  const selectivityValue = row => finite(row.metrics?.selectivity ?? row.selectivity ?? row.metrics?.iaSTSelectivity ?? row.iaSTSelectivity)
  const iastValue = row => finite(row.metrics?.iaSTSelectivity ?? row.iaSTSelectivity)
  const experimentalSelectivity = rows.filter(row => {
    const sourceType = String(row.fieldSources?.selectivity?.sourceType || "")
    return selectivityValue(row) !== null && (sourceType.includes("mixture") || row.baseDataGrade === "experimental")
  }).length
  const linkedToStructure = rows.filter(row => Number(row.structuralLinkCount || 0) > 0 || String(row.identityStatus || "").includes("structural")).length
  return {
    gasPair: scenario.gasPair,
    total: rows.length,
    experimental: gradeCounts.experimental || 0,
    computed: gradeCounts.computed || 0,
    computedIast: gradeCounts["computed-IAST"] || 0,
    seed: gradeCounts.seed || 0,
    withIsotherm: rows.filter(row => Array.isArray(row.isotherm) && row.isotherm.length >= 2).length,
    withSelectivity: rows.filter(row => selectivityValue(row) !== null).length,
    withIastSelectivity: rows.filter(row => iastValue(row) !== null).length,
    withExperimentalSelectivity: experimentalSelectivity,
    withWorkingCapacity: rows.filter(row => finite(row.metrics?.workingCapacity ?? row.workingCapacity) !== null).length,
    linkedToStructure,
    gradeCounts,
    thin: rows.length < 20 || rows.filter(row => selectivityValue(row) !== null).length < 5,
  }
}

export function buildGasSeparationScreening(records = [], scenario = {}) {
  const capacityRows = rankCapacityRecords(records, {
    gasPair: scenario.gasPair,
    adsorptionPressureBar: scenario.adsorptionPressureBar ?? scenario.pressureBar,
    desorptionPressureBar: scenario.desorptionPressureBar,
  })
  const rankedRecords = rankGasCandidates(capacityRows, scenario)
  return {
    rankedRecords,
    paretoFrontier: getParetoFrontier(rankedRecords),
    coverage: summarizeGasScreeningCoverage(capacityRows, scenario),
  }
}
