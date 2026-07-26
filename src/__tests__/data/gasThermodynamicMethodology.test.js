import { describe, expect, it } from "vitest"
import modules from "../../../public/data/methodology_modules_demo.json"

describe("GasSep thermodynamic methodology", () => {
  const gasSep = modules.find(module => module.id === "gassep")
  const thermodynamics = gasSep?.methodGroups?.find(group => group.id === "gassep-thermodynamic-interpretation")

  it("registers result-specific equations and evidence boundaries", () => {
    expect(thermodynamics).toBeTruthy()
    expect(thermodynamics.formulas.map(formula => formula.id)).toEqual(expect.arrayContaining([
      "gassep-henry-affinity",
      "gassep-henry-ratio",
      "gassep-scenario-iast",
      "gassep-iast-equilibrium-constraints",
      "gassep-isosteric-heat",
    ]))
    expect(thermodynamics.formulas.find(formula => formula.id === "gassep-henry-affinity").latex)
      .toMatch(/partial q_i.*partial P_i/)
    expect(JSON.stringify(thermodynamics.limitationsZh)).toMatch(/单条等温线|三个温度/)
    expect(JSON.stringify(thermodynamics.limitationsZh)).toMatch(/穿透|过程性能/)
    expect(JSON.stringify(thermodynamics.limitationsZh)).toMatch(/纯组分压力.*来源曲线上限/)
  })

  it("lists the primary methods and the PPT-relevant separation examples", () => {
    const ids = thermodynamics.references.map(reference => reference.id)
    expect(ids).toEqual(expect.arrayContaining([
      "nist-adsorption-reporting-guidelines",
      "nist-adsorption-data-resources",
      "myers-prausnitz-1965",
      "pyiast-2016",
      "fju90a-c2h2-co2",
      "trace-c2h2-c2h4-2020",
    ]))
    for (const reference of thermodynamics.references) {
      expect(reference.url).toMatch(/^https:\/\//)
      expect(reference.noteZh.length).toBeGreaterThan(8)
    }
  })
})
