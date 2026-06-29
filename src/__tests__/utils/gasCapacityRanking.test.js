import { describe, expect, it } from "vitest"
import { calculateWorkingCapacity, interpolateIsotherm, rankCapacityRecords } from "../../utils/gasCapacityRanking"

const record = {
  id: "mof-a",
  displayName: "MOF-A",
  gasPair: "CO2/N2",
  metrics: { selectivity: 10 },
  condition: { adsorptionPressureBar: 1, desorptionPressureBar: 0.1 },
  isotherm: [
    { pressureBar: 0.1, uptake: 0.5 },
    { pressureBar: 1, uptake: 2.5 },
    { pressureBar: 5, uptake: 4 },
  ],
}

describe("gas capacity ranking", () => {
  it("interpolates isotherms and recomputes working capacity when pressure changes", () => {
    expect(interpolateIsotherm(record.isotherm, 0.55).value).toBeCloseTo(1.5)
    expect(calculateWorkingCapacity(record, { adsorptionPressureBar: 1, desorptionPressureBar: 0.1 }).value).toBeCloseTo(2)
    expect(calculateWorkingCapacity(record, { adsorptionPressureBar: 5, desorptionPressureBar: 1 }).value).toBeCloseTo(1.5)
  })

  it("marks single-point records as non-adjustable instead of inventing capacity", () => {
    const result = calculateWorkingCapacity({ metrics: {}, isotherm: [{ pressureBar: 1, uptake: 2 }] }, { adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    expect(result.value).toBeNull()
    expect(result.status).toBe("single-point-no-capacity")
  })

  it("sorts records by recomputed capacity", () => {
    const rows = rankCapacityRecords([
      record,
      { ...record, id: "mof-b", displayName: "MOF-B", isotherm: [{ pressureBar: 0.1, uptake: 0.2 }, { pressureBar: 1, uptake: 4 }] },
    ], { gasPair: "CO2/N2", adsorptionPressureBar: 1, desorptionPressureBar: 0.1 })
    expect(rows[0].id).toBe("mof-b")
    expect(rows[0].capacityAdjustable).toBe(true)
  })
})
