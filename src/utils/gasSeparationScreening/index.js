// @ts-nocheck
import { rankGasCandidates } from "../gasScoring"
import { rankCapacityRecords } from "../gasCapacityRanking"

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function getParetoFrontier(rows = [], xKey = "workingCapacity", yKey = "selectivity") {
  const points = rows
    .map(row => ({ row, x: finite(row[xKey] ?? row.metrics?.[xKey]), y: finite(row[yKey] ?? row.metrics?.[yKey]) }))
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
  return {
    gasPair: scenario.gasPair,
    total: rows.length,
    experimental: gradeCounts.experimental || 0,
    computed: gradeCounts.computed || 0,
    seed: gradeCounts.seed || 0,
    withIsotherm: rows.filter(row => Array.isArray(row.isotherm) && row.isotherm.length >= 2).length,
    withSelectivity: rows.filter(row => finite(row.metrics?.selectivity ?? row.selectivity) !== null).length,
    withWorkingCapacity: rows.filter(row => finite(row.metrics?.workingCapacity ?? row.workingCapacity) !== null).length,
    gradeCounts,
    thin: rows.length < 20 || rows.filter(row => finite(row.metrics?.selectivity ?? row.selectivity) !== null).length < 5,
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
