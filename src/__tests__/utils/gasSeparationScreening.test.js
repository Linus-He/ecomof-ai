import { describe, expect, it } from "vitest"
import { buildGasSeparationScreening, getParetoFrontier } from "../../utils/gasSeparationScreening"

describe("gas separation screening", () => {
  it("computes a Pareto frontier where dominated points are removed", () => {
    const rows = [
      { id: "a", workingCapacity: 1, selectivity: 10 },
      { id: "b", workingCapacity: 2, selectivity: 8 },
      { id: "c", workingCapacity: 2, selectivity: 12 },
      { id: "d", workingCapacity: 0.5, selectivity: 4 },
    ]
    expect(getParetoFrontier(rows).map(row => row.id)).toEqual(["c"])
  })

  it("updates screening rows when pressure-window capacity changes", () => {
    const records = [
      {
        id: "a",
        displayName: "A",
        gasPair: "CO2/N2",
        dataGrade: "experimental",
        evidence: { evidenceLevel: "A", confidence: 0.9, dataType: "experimental_literature" },
        descriptors: {},
        metrics: { primaryUptake: 2, selectivity: 10, workingCapacity: 1, regenerability: 50 },
        isotherm: [{ pressureBar: 0.1, uptake: 0.2 }, { pressureBar: 1, uptake: 2 }, { pressureBar: 5, uptake: 4 }],
      },
    ]
    const low = buildGasSeparationScreening(records, { gasPair: "CO2/N2", adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    const high = buildGasSeparationScreening(records, { gasPair: "CO2/N2", adsorptionPressureBar: 5, desorptionPressureBar: 0.1 })
    expect(low.rankedRecords[0].workingCapacity).not.toBe(high.rankedRecords[0].workingCapacity)
    expect(high.coverage.total).toBe(1)
  })
})
