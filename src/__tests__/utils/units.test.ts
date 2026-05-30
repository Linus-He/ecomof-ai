// @ts-nocheck
import { describe, expect, it } from "vitest"
import { convertLength, convertPressure, convertTemperature, convertUptake, normalizeUnitLabel } from "../../utils/units"

describe("unit conversion utilities", () => {
  it("converts pressure units through Pa", () => {
    expect(convertPressure(1, "bar", "Pa")).toBeCloseTo(100000, 6)
    expect(convertPressure(1, "atm", "Pa")).toBeCloseTo(101325, 6)
    expect(convertPressure(760, "mmHg", "atm")).toBeCloseTo(1, 4)
  })

  it("converts temperature and rejects values below absolute zero", () => {
    expect(convertTemperature(25, "C", "K")).toBeCloseTo(298.15, 6)
    expect(convertTemperature(298.15, "K", "C")).toBeCloseTo(25, 6)
    expect(() => convertTemperature(-1, "K", "C")).toThrow(/absolute zero/i)
  })

  it("converts length to Angstrom", () => {
    expect(convertLength(1, "nm", "Å")).toBeCloseTo(10, 6)
    expect(convertLength(100, "pm", "Å")).toBeCloseTo(1, 6)
  })

  it("converts uptake with explicit gas or molar mass", () => {
    expect(convertUptake(1, "mmol/g", "mg/g", { gas: "CO2" })).toBeCloseTo(44.01, 6)
    expect(convertUptake(1, "mmol/g", "cm3(STP)/g")).toBeCloseTo(22.414, 6)
    expect(convertUptake(44.01, "mg/g", "mmol/g", { molarMass: 44.01 })).toBeCloseTo(1, 6)
  })

  it("does not silently convert unsupported or underspecified units", () => {
    expect(() => convertPressure(1, "psi", "Pa")).toThrow(/unsupported pressure unit/i)
    expect(() => convertUptake(44.01, "mg/g", "mmol/g")).toThrow(/molar mass is required/i)
  })

  it("normalizes display labels", () => {
    expect(normalizeUnitLabel("m2/g")).toBe("m²/g")
    expect(normalizeUnitLabel("cm3/g")).toBe("cm³/g")
  })
})
