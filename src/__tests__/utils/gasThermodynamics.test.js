import { describe, expect, it } from "vitest"
import {
  buildPairedIsothermBundle,
  buildThermodynamicInterpretation,
  estimateHenryAffinity,
  estimateIsostericHeat,
} from "../../utils/gasThermodynamics"

function langmuirPoints(qm, b, pressures = [0.05, 0.1, 0.2, 0.5, 1, 2, 5]) {
  return pressures.map(pressureBar => ({
    pressureBar,
    uptake: qm * b * pressureBar / (1 + b * pressureBar),
  }))
}

function sourceRecord({ id, sourceId, temperatureK, gas = "CO2", isotherm, canonicalId = "mof-test", doi = "10.1000/test" }) {
  return {
    id,
    canonicalId,
    primaryGas: gas,
    condition: { temperatureK },
    isotherm,
    linkedIsotherms: { primary: { filename: sourceId } },
    recordProvenance: { sourceRecordId: sourceId, doi },
  }
}

describe("GasSep thermodynamic interpretation", () => {
  it("resolves a linked secondary isotherm without changing the selected record", () => {
    const secondary = sourceRecord({
      id: "secondary",
      sourceId: "doi.isotherm-2",
      temperatureK: 298,
      gas: "N2",
      isotherm: langmuirPoints(3, 0.2),
    })
    const selected = {
      ...sourceRecord({
        id: "primary",
        sourceId: "doi.isotherm-1",
        temperatureK: 298,
        isotherm: langmuirPoints(4, 2),
      }),
      linkedIsotherms: {
        primary: { filename: "doi.isotherm-1" },
        secondary: { filename: "DOI.ISOTHERM-2" },
      },
    }

    const bundle = buildPairedIsothermBundle(selected, [selected, secondary])
    expect(bundle.status).toBe("paired-isotherms")
    expect(bundle.secondaryRecord.id).toBe("secondary")
    expect(bundle.primary).toHaveLength(7)
    expect(bundle.secondary).toHaveLength(7)
  })

  it("prefers a provenance-backed embedded secondary curve when the source record is not otherwise loaded", () => {
    const selected = {
      ...sourceRecord({
        id: "primary",
        sourceId: "doi.isotherm-1",
        temperatureK: 298,
        isotherm: langmuirPoints(4, 2),
      }),
      secondaryIsotherm: langmuirPoints(3, 0.2).map(point => ({ ...point, gas: "N2" })),
      secondaryIsothermTemperatureK: 298,
      linkedIsotherms: {
        primary: { filename: "doi.isotherm-1" },
        secondary: { filename: "doi.isotherm-2" },
      },
    }

    const bundle = buildPairedIsothermBundle(selected, [selected])
    expect(bundle.status).toBe("paired-isotherms")
    expect(bundle.secondaryRecord).toBeNull()
    expect(bundle.secondary).toHaveLength(7)
  })

  it("derives the zero-pressure Henry affinity from the selected isotherm model", () => {
    const result = estimateHenryAffinity(langmuirPoints(4, 2))
    expect(result.status).toBe("model-derived-henry")
    expect(result.value).toBeCloseTo(8, 1)
    expect(result.fit.r2).toBeGreaterThan(0.999)
  })

  it("recomputes IAST only for paired, temperature-matched, pressure-supported isotherms", () => {
    const broadPressureWindow = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]
    const secondary = sourceRecord({
      id: "secondary",
      sourceId: "doi.isotherm-2",
      temperatureK: 298,
      gas: "N2",
      isotherm: langmuirPoints(3, 0.2, broadPressureWindow),
    })
    const selected = {
      ...sourceRecord({
        id: "primary",
        sourceId: "doi.isotherm-1",
        temperatureK: 298,
        isotherm: langmuirPoints(4, 2, broadPressureWindow),
      }),
      linkedIsotherms: {
        primary: { filename: "doi.isotherm-1" },
        secondary: { filename: "doi.isotherm-2" },
      },
    }
    const first = buildThermodynamicInterpretation(selected, [selected, secondary], {
      temperatureK: 298,
      adsorptionPressureBar: 1,
      mixtureRatio: "15/85",
    })
    const second = buildThermodynamicInterpretation(selected, [selected, secondary], {
      temperatureK: 298,
      adsorptionPressureBar: 1,
      mixtureRatio: "50/50",
    })
    expect(first.iast.status).toBe("computed-IAST")
    expect(second.iast.status).toBe("computed-IAST")
    expect(first.iast.value).not.toBeCloseTo(second.iast.value, 5)

    const mismatch = buildThermodynamicInterpretation(selected, [selected, secondary], {
      temperatureK: 323,
      adsorptionPressureBar: 1,
      mixtureRatio: "15/85",
    })
    expect(mismatch.iast.status).toBe("scenario-iast-unavailable")
    expect(mismatch.iast.reason).toBe("scenario-temperature-does-not-match-isotherm")
  })

  it("does not report scenario IAST when a fitted fictive pure-component pressure exceeds the source curve", () => {
    const pressureWindow = [0.05, 0.1, 0.2, 0.5, 1]
    const secondary = sourceRecord({
      id: "secondary-limited",
      sourceId: "doi.isotherm-2",
      temperatureK: 298,
      gas: "N2",
      isotherm: langmuirPoints(3, 0.001, pressureWindow),
    })
    const selected = {
      ...sourceRecord({
        id: "primary-limited",
        sourceId: "doi.isotherm-1",
        temperatureK: 298,
        isotherm: langmuirPoints(4, 20, pressureWindow),
      }),
      linkedIsotherms: {
        primary: { filename: "doi.isotherm-1" },
        secondary: { filename: "doi.isotherm-2" },
      },
    }

    const result = buildThermodynamicInterpretation(selected, [selected, secondary], {
      temperatureK: 298,
      adsorptionPressureBar: 1,
      mixtureRatio: "15/85",
    })
    expect(result.iast.status).toBe("scenario-iast-unavailable")
    expect(result.iast.reason).toBe("fitted-pure-pressure-outside-source-range")
    expect(result.iastFitRange.supported).toBe(false)
    expect(result.iastFitRange.secondaryPurePressure).toBeGreaterThan(result.iastFitRange.secondaryMax)
  })

  it("recovers a bounded Clausius-Clapeyron Qst from three same-source temperatures", () => {
    const qstKjMol = 24
    const bAtTemperature = temperatureK => Math.exp(qstKjMol * 1000 / 8.314462618 * (1 / temperatureK - 1 / 298))
    const series = [288, 298, 308].map(temperatureK => sourceRecord({
      id: `record-${temperatureK}`,
      sourceId: `doi.isotherm-${temperatureK}`,
      temperatureK,
      isotherm: langmuirPoints(4, bAtTemperature(temperatureK)),
    }))

    const result = estimateIsostericHeat(series[1], series)
    expect(result.status).toBe("clausius-clapeyron-qst")
    expect(Math.abs(result.value - qstKjMol)).toBeLessThan(1)
    expect(result.temperatureCount).toBe(3)
    expect(result.r2).toBeGreaterThan(0.99)
  })

  it("does not derive Qst from one temperature or mixed publications", () => {
    const selected = sourceRecord({
      id: "record-298",
      sourceId: "doi.isotherm-298",
      temperatureK: 298,
      isotherm: langmuirPoints(4, 2),
    })
    const foreign = sourceRecord({
      id: "record-308",
      sourceId: "doi.isotherm-308",
      temperatureK: 308,
      doi: "10.1000/other",
      isotherm: langmuirPoints(4, 1.5),
    })
    const result = estimateIsostericHeat(selected, [selected, foreign])
    expect(result.status).toBe("qst-unavailable")
    expect(result.temperatureCount).toBe(1)
  })
})
