import { describe, expect, it } from "vitest"
import methodology from "../../../public/data/methodology_modules_demo.json"
import { gasMetricFormulaBasis } from "../../components/tabs/GasSepTab"
import { withRecomputedCapacity } from "../../utils/gasCapacityRanking"

const gasSep = methodology.find(module => module.id === "gassep")
const formulas = new Map(
  gasSep.methodGroups.flatMap(group => group.formulas || []).map(formula => [formula.id, formula]),
)

describe("GasSep formula-to-result alignment", () => {
  it("uses distinct equations for recalculated IAST, source IAST, uptake proxy, prediction, and source values", () => {
    const computedIast = gasMetricFormulaBasis({
      iastStatus: "computed-IAST",
      iaSTSelectivity: 8,
      fieldSources: { selectivity: { sourceType: "iast_from_pure_component_isotherms" } },
    }, "zh")
    const sourceIast = gasMetricFormulaBasis({
      iaSTSelectivity: 8,
      fieldSources: { iaSTSelectivity: { sourceType: "seed_source_specific_isotherm" } },
    }, "zh")
    const uptakeProxy = gasMetricFormulaBasis({
      fieldSources: { selectivity: { sourceType: "single_component_ratio" } },
    }, "zh")
    const prediction = gasMetricFormulaBasis({
      dataType: "predicted_ml",
      fieldSources: { selectivity: { sourceType: "predicted_ml" } },
    }, "zh")
    const source = gasMetricFormulaBasis({
      dataType: "experimental_literature",
      fieldSources: { selectivity: { sourceType: "experimental_literature" } },
    }, "zh")

    expect(computedIast.selectivity.kind).toBe("本项目重算 IAST")
    expect(computedIast.selectivity.formula).toMatch(/xᵢ\/yᵢ/)
    expect(sourceIast.selectivity.kind).toBe("来源 IAST 值")
    expect(sourceIast.selectivity.formula).toMatch(/Ssource/)
    expect(uptakeProxy.selectivity.formula).toContain("qᵢ / qⱼ")
    expect(prediction.selectivity.formula).toMatch(/fθ/)
    expect(source.selectivity.formula).toMatch(/Ssource/)
    expect(new Set([
      computedIast.selectivity.formula,
      sourceIast.selectivity.formula,
      uptakeProxy.selectivity.formula,
      prediction.selectivity.formula,
      source.selectivity.formula,
    ]).size).toBe(5)
  })

  it("keeps working capacity and regenerability equations identical to the runtime calculation", () => {
    const record = {
      metrics: {},
      isotherm: [
        { pressureBar: 0.1, uptake: 0.8 },
        { pressureBar: 1, uptake: 3.2 },
        { pressureBar: 5, uptake: 4.5 },
      ],
    }
    const result = withRecomputedCapacity(record, {
      adsorptionPressureBar: 1,
      desorptionPressureBar: 0.1,
    })
    expect(result.workingCapacity).toBeCloseTo(3.2 - 0.8, 6)
    expect(result.regenerability).toBeCloseTo(100 * (3.2 - 0.8) / 3.2, 1)

    const basis = gasMetricFormulaBasis(result, "zh")
    expect(basis.capacity.formula).toBe("Cw = q(Pads,T) − q(Pdes,T)")
    expect(basis.regenerability.formula).toBe("R = 100 · Cw / q(Pads,T)")
    expect(formulas.get("gassep-working-capacity").fallback).toBe("Cw = q_A(P_ads,T) - q_A(P_des,T)")
    expect(formulas.get("gassep-regenerability-proxy").fallback).toBe("R(%) = 100 × Cw / q_A(P_ads,T)")
    expect(formulas.get("gassep-regenerability-proxy").latex).not.toContain("f(Q")
  })

  it("documents every selectivity principle that can be rendered by the decision panel", () => {
    expect([...formulas.keys()]).toEqual(expect.arrayContaining([
      "gassep-source-selectivity",
      "gassep-source-iast",
      "gassep-uptake-ratio-proxy",
      "gassep-predicted-selectivity",
      "gassep-scenario-iast",
      "gassep-henry-affinity",
      "gassep-henry-ratio",
      "gassep-isosteric-heat",
      "gassep-working-capacity",
      "gassep-regenerability-proxy",
    ]))
  })
})
