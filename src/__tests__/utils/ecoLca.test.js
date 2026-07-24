import { describe, expect, it } from "vitest"
import inventoryRows from "../../../public/data/lca_inventory.json"
import metalCostTable from "../../../public/data/metal_precursor_cost_table.json"
import model from "../../../public/data/ecoscreen_lca_model_v1.json"
import {
  assessEcoLcaReadiness,
  buildEcoLcaScenario,
  compareEcoLcaCandidateCosts,
  compareEcoLcaRoutes,
} from "../../utils/ecoLca"

const completeCandidate = {
  id: "complete-cu",
  name: "Complete Cu MOF",
  metalNode: "Cu",
  linker: "btc",
  synthesisRoute: "solvothermal",
  synthesisSolvent: "DMF",
  synthesisTemperatureC: 120,
  synthesisTimeHours: 24,
  reactionQuantities: { metal: [{ quantity: 1, unit: "kg" }] },
  massBalance: { inputKg: 1.25, outputKg: 1, wasteKg: 0.25 },
  yield: 80,
  synthesisEnergy: 12,
  solventRecovery: 90,
  workingCapacity: 0.12,
  cycleStability: 1000,
  regenerationEnergy: 0.35,
}

const run = (overrides = {}) => buildEcoLcaScenario({
  candidate: completeCandidate,
  inventoryRows,
  metalCostRows: metalCostTable.records,
  model,
  routeId: "solvothermal",
  functionalUnitId: "kg_mof",
  ...overrides,
})

describe("EcoScreen LCA and economic scenario model", () => {
  it("keeps ISO scope, functional units, route assumptions, and literature sources explicit", () => {
    expect(model.status).toBe("screening-scenario-model")
    expect(model.functionalUnits.map(item => item.id)).toEqual(["kg_mof", "tonne_co2"])
    expect(model.routeScenarios.map(item => item.id)).toEqual(["solvothermal", "aqueous", "mechanochemical"])
    expect(model.sources.map(source => source.id)).toEqual(expect.arrayContaining([
      "STD-ISO-14040-14044",
      "LIT-LCA-MOF-2017",
      "LIT-DESANTIS-2017-MOF-TEA",
      "LIT-XIA-2022-ZIF8-LCA",
      "LIT-ESCOBAR-2023-ZIF67-LCA",
      "LIT-WANG-2024-MOF74-LCA",
    ]))
  })

  it("reports unit-bearing environmental and economic outputs with intervals", () => {
    const result = run()
    expect(result.gwp).toBeGreaterThan(0)
    expect(result.energyMj).toBeGreaterThan(0)
    expect(result.totalCost).toBeGreaterThan(0)
    expect(result.gwpLow).toBeLessThan(result.gwp)
    expect(result.gwpHigh).toBeGreaterThan(result.gwp)
    expect(result.costLow).toBeLessThan(result.totalCost)
    expect(result.costHigh).toBeGreaterThan(result.totalCost)
    expect(result.contributions.length).toBe(7)
  })

  it("reduces solvent burden and cost when solvent recovery rises", () => {
    const lowRecovery = run({ parameters: { solventRecoveryPct: 50 } })
    const highRecovery = run({ parameters: { solventRecoveryPct: 95 } })
    expect(highRecovery.solventKg).toBeLessThan(lowRecovery.solventKg)
    expect(highRecovery.gwp).toBeLessThan(lowRecovery.gwp)
    expect(highRecovery.totalCost).toBeLessThan(lowRecovery.totalCost)
  })

  it("reduces material and process burden when yield improves", () => {
    const lowYield = run({ parameters: { yieldPct: 50 } })
    const highYield = run({ parameters: { yieldPct: 90 } })
    expect(highYield.gwp).toBeLessThan(lowYield.gwp)
    expect(highYield.totalCost).toBeLessThan(lowYield.totalCost)
  })

  it("keeps metal price in the economic model instead of using it as an environmental factor", () => {
    const iron = run({ candidate: { ...completeCandidate, id: "fe", metalNode: "Fe" } })
    const cobalt = run({ candidate: { ...completeCandidate, id: "co", metalNode: "Co" } })
    expect(cobalt.totalCost).toBeGreaterThan(iron.totalCost)
    expect(cobalt.gwp).toBeCloseTo(iron.gwp, 8)
  })

  it("shows one representative candidate per metal instead of duplicating the same cost proxy", () => {
    const rows = compareEcoLcaCandidateCosts({
      candidates: [
        { ...completeCandidate, id: "fe-a", name: "Fe A", metalNode: "Fe" },
        { ...completeCandidate, id: "fe-b", name: "Fe B", metalNode: "Fe" },
        { ...completeCandidate, id: "cu-a", name: "Cu A", metalNode: "Cu" },
      ],
      inventoryRows,
      metalCostRows: metalCostTable.records,
      model,
    })
    expect(rows.map(row => row.metal)).toEqual(["Fe", "Cu"])
  })

  it("uses route comparison for transparent scenarios rather than claiming a universal route winner", () => {
    const routes = compareEcoLcaRoutes({
      candidate: completeCandidate,
      inventoryRows,
      metalCostRows: metalCostTable.records,
      model,
      functionalUnitId: "kg_mof",
    })
    const baseline = routes.find(row => row.route.id === "solvothermal")
    const mechanochemical = routes.find(row => row.route.id === "mechanochemical")
    expect(mechanochemical.solventKg).toBeLessThan(baseline.solventKg)
    expect(mechanochemical.route.assumptionZh).toMatch(/不能假定所有 MOF/)
  })

  it("normalizes a service scenario to one tonne of captured CO2 and adds regeneration electricity", () => {
    const service = run({ functionalUnitId: "tonne_co2" })
    expect(service.materialRequiredKg).toBeGreaterThan(0)
    expect(service.regenerationElectricityKwh).toBe(350)
    expect(service.contributions.some(row => row.id === "service_regeneration")).toBe(true)
  })

  it("gates incomplete Open MOF-style records as scenario-only", () => {
    const incomplete = { id: "seed", name: "Seed MOF", metalNode: "Zr" }
    const readiness = assessEcoLcaReadiness(incomplete, "kg_mof", model)
    const result = run({ candidate: incomplete })
    expect(readiness.grade).toBe("D")
    expect(readiness.comparable).toBe(false)
    expect(result.conclusionStatus).toBe("scenario_only")
    expect(result.readiness.missingFields).toEqual(expect.arrayContaining([
      "linker",
      "synthesisRoute",
      "synthesisSolvent",
      "synthesisTemperature",
      "synthesisTime",
      "reactionQuantities",
      "yield",
      "synthesisEnergy",
    ]))
    expect(result.readiness.missingHardBlockers).toEqual(["yield", "massBalance", "synthesisEnergy", "solventRecovery"])
  })
})
