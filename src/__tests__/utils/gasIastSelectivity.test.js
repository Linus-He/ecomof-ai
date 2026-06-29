import { describe, expect, it } from "vitest"
import { calculateIastSelectivity, parseMixtureRatio, solveBinaryIast } from "../../utils/gasIastSelectivity"

function langmuirPoints(qm, b) {
  return [0.05, 0.1, 0.2, 0.5, 1, 2, 5].map(pressureBar => ({
    pressureBar,
    uptake: qm * b * pressureBar / (1 + b * pressureBar),
  }))
}

describe("gas IAST selectivity", () => {
  it("computes a reproducible binary IAST selectivity from paired pure isotherms", () => {
    const result = calculateIastSelectivity({
      primaryIsotherm: langmuirPoints(4, 2),
      secondaryIsotherm: langmuirPoints(3, 0.2),
      mixtureRatio: "15/85",
      pressureBar: 1,
    })

    expect(result.status).toBe("computed-IAST")
    expect(result.value).toBeCloseTo(14.2289, 3)
    expect(result.primaryFit.r2).toBeGreaterThan(0.999)
    expect(result.secondaryFit.r2).toBeGreaterThan(0.999)
    expect(result.adsorbedFractions.primary).toBeGreaterThan(result.gasFractions.primary)
  })

  it("returns an honest unavailable status when either isotherm is too thin", () => {
    const result = calculateIastSelectivity({
      primaryIsotherm: langmuirPoints(4, 2),
      secondaryIsotherm: [{ pressureBar: 1, uptake: 0.4 }],
      mixtureRatio: "15/85",
      pressureBar: 1,
    })

    expect(result.status).toBe("selectivity-unavailable")
    expect(result.reason).toBe("need both isotherms")
    expect(result.secondaryFit.status).toBe("insufficient-isotherm")
  })

  it("solves direct Langmuir IAST consistently with fixed model parameters", () => {
    const ratio = parseMixtureRatio("15/85")
    const result = solveBinaryIast({
      primaryFit: { model: "langmuir", parameters: { qm: 4, b: 2 } },
      secondaryFit: { model: "langmuir", parameters: { qm: 3, b: 0.2 } },
      pressureBar: 1,
      primaryFraction: ratio.primaryFraction,
    })

    expect(result.status).toBe("computed-IAST")
    expect(result.selectivity).toBeCloseTo(14.1917, 3)
  })
})
