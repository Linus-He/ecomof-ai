import { describe, expect, it } from "vitest"
import {
  DEFAULT_GAS_RANKING_METHOD,
  buildGasSeparationScreening,
  getParetoFrontier,
} from "../../utils/gasSeparationScreening"

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
    const result = buildGasSeparationScreening(records, { gasPair: "CO2/N2", adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    expect(result.coverage.computedIast).toBe(1)
    expect(result.coverage.withIastSelectivity).toBe(1)
    expect(result.coverage.withSelectivity).toBe(1)
    expect(result.coverage.linkedToStructure).toBe(1)
    expect(result.rankedRecords[0].id).toBe("iast")
  })

  it("defaults to Pareto + APS instead of subjective GasScore weights", () => {
    const records = [
      {
        id: "frontier-high-aps",
        displayName: "Frontier high APS",
        gasPair: "CO2/N2",
        dataGrade: "experimental",
        evidence: { evidenceLevel: "A", confidence: 0.9, dataType: "experimental_literature" },
        descriptors: { waterStability: "high", thermalStability: 450, density: 0.7 },
        metrics: { primaryUptake: 3, selectivity: 10, workingCapacity: 3, regenerability: 80 },
      },
      {
        id: "frontier-selectivity",
        displayName: "Frontier selectivity",
        gasPair: "CO2/N2",
        dataGrade: "experimental",
        evidence: { evidenceLevel: "A", confidence: 0.9, dataType: "experimental_literature" },
        descriptors: { waterStability: "high", thermalStability: 450, density: 0.7 },
        metrics: { primaryUptake: 2, selectivity: 20, workingCapacity: 1, regenerability: 70 },
      },
      {
        id: "dominated",
        displayName: "Dominated",
        gasPair: "CO2/N2",
        dataGrade: "experimental",
        evidence: { evidenceLevel: "A", confidence: 0.9, dataType: "experimental_literature" },
        descriptors: { waterStability: "high", thermalStability: 450, density: 0.7 },
        metrics: { primaryUptake: 8, selectivity: 5, workingCapacity: 1, regenerability: 90 },
      },
    ]
    const result = buildGasSeparationScreening(records, { gasPair: "CO2/N2", adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    expect(result.methodId).toBe(DEFAULT_GAS_RANKING_METHOD)
    expect(result.rankedRecords[0].id).toBe("frontier-high-aps")
    expect(result.rankedRecords[0].gasScreening.paretoFrontier).toBe(true)
    expect(result.rankedRecords[0].gasScreening.aps).toBe(30)
    expect(result.rankedRecords.find(row => row.id === "dominated").gasScreening.paretoFrontier).toBe(false)
  })

  it("derives CRITIC weights from the current candidate matrix", () => {
    const records = [
      { id: "a", displayName: "A", gasPair: "CO2/N2", evidence: { evidenceLevel: "A", confidence: 0.9 }, descriptors: { waterStability: "high", thermalStability: 460, density: 0.7 }, metrics: { primaryUptake: 2, selectivity: 10, workingCapacity: 1, regenerability: 60 } },
      { id: "b", displayName: "B", gasPair: "CO2/N2", evidence: { evidenceLevel: "B", confidence: 0.8 }, descriptors: { waterStability: "moderate", thermalStability: 400, density: 0.8 }, metrics: { primaryUptake: 4, selectivity: 8, workingCapacity: 2, regenerability: 80 } },
      { id: "c", displayName: "C", gasPair: "CO2/N2", evidence: { evidenceLevel: "B", confidence: 0.75 }, descriptors: { waterStability: "high", thermalStability: 480, density: 0.6 }, metrics: { primaryUptake: 3, selectivity: 16, workingCapacity: 1.4, regenerability: 70 } },
      { id: "d", displayName: "D", gasPair: "CO2/N2", evidence: { evidenceLevel: "C", confidence: 0.6 }, descriptors: { waterStability: "low", thermalStability: 330, density: 0.9 }, metrics: { primaryUptake: 1, selectivity: 5, workingCapacity: 0.7, regenerability: 55 } },
    ]
    const result = buildGasSeparationScreening(records, { gasPair: "CO2/N2", rankingMethod: "critic-objective" })
    const weights = result.rankedRecords[0].gasScreening.criticWeights
    expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6)
    expect(Object.values(weights).every(value => value >= 0)).toBe(true)
    expect(result.rankedRecords.every(row => Number.isFinite(row.gasScreening.criticScore))).toBe(true)
  })

  it("builds an interactive funnel model from real field coverage", () => {
    const records = [
      { id: "eligible", displayName: "Eligible", gasPair: "CO2/N2", evidence: { evidenceLevel: "A", confidence: 0.9 }, descriptors: { waterStability: "high" }, metrics: { primaryUptake: 2, selectivity: 10, workingCapacity: 1, regenerability: 80 } },
      { id: "no-regeneration", displayName: "No regeneration", gasPair: "CO2/N2", evidence: { evidenceLevel: "B", confidence: 0.8 }, descriptors: { waterStability: "high" }, metrics: { selectivity: 8, workingCapacity: 1.2 } },
      { id: "no-selectivity", displayName: "No selectivity", gasPair: "CO2/N2", evidence: { evidenceLevel: "C", confidence: 0.4 }, descriptors: { waterStability: "moderate" }, metrics: { primaryUptake: 2, workingCapacity: 1.2, regenerability: 60 } },
    ]
    const result = buildGasSeparationScreening(records, { gasPair: "CO2/N2", adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    const counts = Object.fromEntries(result.screeningFunnel.map(gate => [gate.id, gate.count]))
    expect(counts.all).toBe(3)
    expect(counts["aps-eligible"]).toBe(2)
    expect(counts["regenerability-eligible"]).toBe(1)
    expect(result.rankingStability.length).toBeGreaterThan(0)
  })
})
