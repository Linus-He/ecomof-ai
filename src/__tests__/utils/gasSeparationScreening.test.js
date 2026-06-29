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

  it("counts computed IAST selectivity and structural identity coverage honestly", () => {
    const records = [
      {
        id: "iast",
        displayName: "IAST MOF",
        gasPair: "CO2/N2",
        dataGrade: "computed-IAST",
        baseDataGrade: "experimental",
        identityStatus: "matched-by-composition",
        structuralLinkCount: 2,
        evidence: { evidenceLevel: "B", confidence: 0.82, dataType: "simulated_iast" },
        fieldSources: { selectivity: { sourceType: "iast_from_pure_component_isotherms" } },
        descriptors: {},
        metrics: { primaryUptake: 2, iaSTSelectivity: 18, workingCapacity: 0.9, regenerability: 45 },
      },
      {
        id: "thin",
        displayName: "Thin MOF",
        gasPair: "CO2/N2",
        dataGrade: "experimental",
        evidence: { evidenceLevel: "A", confidence: 0.94, dataType: "experimental_literature" },
        fieldSources: { selectivity: { sourceType: "selectivity-unavailable" } },
        descriptors: {},
        metrics: { primaryUptake: 1.4, workingCapacity: 0.7, regenerability: 50 },
      },
    ]
    const result = buildGasSeparationScreening(records, { gasPair: "CO2/N2" })
    expect(result.coverage.computedIast).toBe(1)
    expect(result.coverage.withIastSelectivity).toBe(1)
    expect(result.coverage.withSelectivity).toBe(1)
    expect(result.coverage.linkedToStructure).toBe(1)
    expect(result.rankedRecords[0].id).toBe("iast")
  })
})
