import { describe, expect, it } from "vitest"
import records from "../../../public/data/gas_adsorption_records_v2.json"
import {
  buildThermodynamicInterpretation,
  estimateIsostericHeat,
} from "../../utils/gasThermodynamics"

function sourceScenario(record, mixtureRatio = record.condition?.mixtureRatio) {
  return {
    gasPair: record.gasPair,
    temperatureK: record.condition?.temperatureK,
    pressureBar: record.condition?.pressureBar,
    adsorptionPressureBar: record.condition?.adsorptionPressureBar ?? record.condition?.pressureBar,
    desorptionPressureBar: record.condition?.desorptionPressureBar,
    mixtureRatio,
  }
}

function curveSignature(record) {
  return JSON.stringify({
    id: record.id,
    primary: record.isotherm.map(point => [point.pressureBar, point.uptake]),
    secondary: record.secondaryIsotherm.map(point => [point.pressureBar, point.uptake]),
  })
}

describe("GasSep real-data thermodynamic audit", () => {
  const computed = records.filter(record => record.dataGrade === "computed-IAST")

  it("keeps both plotted gases, source temperature, and source ids aligned for every computed IAST record", () => {
    expect(computed.length).toBeGreaterThan(60)
    for (const record of computed) {
      const result = buildThermodynamicInterpretation(record, records, sourceScenario(record))
      expect(result.pair.status, record.id).toBe("paired-isotherms")
      expect(result.pair.primaryTemperatureK, record.id).toBe(record.condition.temperatureK)
      expect(result.pair.secondaryTemperatureK, record.id).toBe(record.condition.temperatureK)
      expect(result.pair.primary.every(point => point.gas === record.primaryGas), record.id).toBe(true)
      expect(result.pair.secondary.every(point => point.gas === record.secondaryGas), record.id).toBe(true)
      expect(result.pair.primarySourceId, record.id).toBe(record.iast.sourceIsothermIds.primary)
      expect(result.pair.secondarySourceId, record.id).toBe(record.iast.sourceIsothermIds.secondary.toLowerCase())
    }
  })

  it("reproduces stored IAST values when total and fitted pure-component pressures stay source-supported", () => {
    const recalculated = computed
      .map(record => ({ record, result: buildThermodynamicInterpretation(record, records, sourceScenario(record)) }))
      .filter(({ result }) => result.iast.status === "computed-IAST")

    expect(recalculated.length).toBeGreaterThan(15)
    for (const { record, result } of recalculated) {
      const expected = record.metrics.iaSTSelectivity
      const relativeError = Math.abs(result.iast.value - expected) / Math.max(Math.abs(expected), 1e-12)
      expect(relativeError, record.id).toBeLessThan(1e-4)
    }
  })

  it("changes the equilibrium result with material and feed composition instead of reusing a static curve", () => {
    const eligible = computed
      .map(record => ({
        record,
        source: buildThermodynamicInterpretation(record, records, sourceScenario(record)),
        equimolar: buildThermodynamicInterpretation(record, records, sourceScenario(record, "50/50")),
      }))
      .filter(row => row.source.iast.status === "computed-IAST" && row.equimolar.iast.status === "computed-IAST")

    expect(eligible.length).toBeGreaterThan(15)
    const ratioSensitive = eligible.filter(row => {
      const first = row.source.iast.value
      const second = row.equimolar.iast.value
      return Math.abs(first - second) / Math.max(Math.abs(first), 1e-12) > 1e-3
    })
    expect(ratioSensitive.length).toBeGreaterThan(3)
    expect(new Set(eligible.map(row => row.source.iast.value.toPrecision(6))).size).toBeGreaterThan(12)
    expect(new Set(eligible.map(row => curveSignature(row.record))).size).toBe(eligible.length)
  })

  it("derives Qst only from same-publication multi-temperature series and produces material-specific values", () => {
    const derived = records
      .filter(record => record.metrics?.heatOfAdsorption == null)
      .map(record => ({ record, qst: estimateIsostericHeat(record, records) }))
      .filter(row => row.qst.status === "clausius-clapeyron-qst")

    expect(derived.length).toBeGreaterThan(5)
    expect(new Set(derived.map(row => row.qst.value.toFixed(1))).size).toBeGreaterThan(3)
    for (const { record, qst } of derived.slice(0, 40)) {
      expect(qst.temperatureCount, record.id).toBeGreaterThanOrEqual(3)
      expect(qst.sourceDoi.toLowerCase(), record.id).toBe(record.recordProvenance.doi.toLowerCase())
      expect(qst.value, record.id).toBeGreaterThan(0)
      expect(qst.value, record.id).toBeLessThanOrEqual(120)
    }
  })
})
