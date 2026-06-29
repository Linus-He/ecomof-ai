import { describe, expect, it } from "vitest"
import { buildDescriptorScatterPoints } from "../../components/home/MofDescriptor3DScatter"
import { buildGasParetoRows, buildParetoFrontier, summarizeGasParetoRows } from "../../components/home/GasParetoChart"

describe("homepage research visualizations", () => {
  it("samples a larger real descriptor cloud without fabricating missing axes", () => {
    const points = buildDescriptorScatterPoints()
    expect(points.length).toBeGreaterThanOrEqual(150)
    expect(points.length).toBeLessThanOrEqual(300)
    for (const point of points) {
      expect(Number.isFinite(point.surfaceArea)).toBe(true)
      expect(Number.isFinite(point.poreVolume)).toBe(true)
      expect(Number.isFinite(point.voidFraction)).toBe(true)
      expect(point.source).toBeTruthy()
      expect(point.dataGrade).toBeTruthy()
    }
  })

  it("builds the gas Pareto set from records with both selectivity and working capacity", () => {
    const rows = buildGasParetoRows()
    const summary = summarizeGasParetoRows(rows)
    expect(rows).toHaveLength(79)
    expect(summary["CO2/CH4"].total).toBe(29)
    expect(summary["CO2/N2"].total).toBe(24)
    expect(rows.every(row => row.selectivity > 0 && row.workingCapacity > 0)).toBe(true)
    expect(rows.every(row => row.dataGrade && row.sourceUrl)).toBe(true)
  })

  it("computes a non-dominated Pareto frontier for maximize-capacity/maximize-selectivity", () => {
    const rows = buildGasParetoRows().filter(row => row.gasPair === "CO2/N2")
    const frontier = buildParetoFrontier(rows)
    expect(frontier.length).toBeGreaterThan(0)
    for (const row of frontier) {
      const dominated = rows.some(other =>
        other.id !== row.id &&
        other.workingCapacity >= row.workingCapacity &&
        other.selectivity >= row.selectivity &&
        (other.workingCapacity > row.workingCapacity || other.selectivity > row.selectivity)
      )
      expect(dominated).toBe(false)
    }
  })
})

