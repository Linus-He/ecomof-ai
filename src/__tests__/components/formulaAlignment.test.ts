// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const read = path => readFileSync(resolve(process.cwd(), path), "utf8")

describe("visible formula and result alignment", () => {
  it("defines Pareto membership as the absence of a dominating candidate", () => {
    const source = read("src/components/tabs/HomeTab.tsx")
    expect(source).toContain(String.raw`m\in\mathcal{F}\iff\neg\exists n\ne m`)
    expect(source).not.toContain(String.raw`m\in\mathcal{F}\iff\nexists n\ne m`)
  })

  it("uses the same CRITIC conflict definition as the active calculations", () => {
    const diagram = read("src/components/methods/CriticWeightingDiagram.tsx")
    const implementation = read("src/utils/criticWeighting.ts")
    expect(diagram).toContain(String.raw`\sum_{k=1}^{m}(1-r_{jk})`)
    expect(diagram).not.toContain(String.raw`1-|r_{jk}|`)
    expect(implementation).toContain("return sum + (1 - Math.max(-1, Math.min(1, correlation)))")
  })

  it("keeps source-reported, predicted, uptake-ratio, and IAST selectivity formulas distinct", () => {
    const source = read("src/components/tabs/GasSepTab.tsx")
    expect(source).toContain("Sᵢ/ⱼᴵᴬˢᵀ = (xᵢ/yᵢ) / (xⱼ/yⱼ)")
    expect(source).toContain("Sᵢ/ⱼᵖʳᵒˣʸ = qᵢ / qⱼ")
    expect(source).toContain("Ŝᵢ/ⱼ = fθ(dₘ, κᵣ)")
    expect(source).toContain("Sᵢ/ⱼ⁽ʳ⁾ = Ssource(κᵣ)")
    expect(source).toContain('record?.capacityStatus === "isotherm-derived"')
  })

  it("matches LCA production and service-unit formulas to the scenario calculator", () => {
    const panel = read("src/components/ecoscreen/EcoLcaWorkbench.tsx")
    const calculator = read("src/utils/ecoLca/index.js")
    expect(panel).toContain("I<sub>GWP</sub><sup>prod</sup>(m) = Σ q<sub>mk</sub> · CF<sub>k</sub>")
    expect(panel).toContain("(Σ q<sub>mr</sub> · p<sub>r</sub> + C<sub>conv</sub>)(1 + f<sub>cont</sub>)")
    expect(panel).toContain("s<sub>FU</sub>I<sub>GWP</sub><sup>prod</sup> + E<sub>reg</sub>CF<sub>el</sub>")
    expect(calculator).toContain("const totalCost = (variableCost + conversionCost) * (1 + contingency)")
    expect(calculator).toContain("gwp: production.gwp * materialRequiredKg + regenerationGwp")
  })

  it("shows the exact point-radius rule and closes the final histogram bin", () => {
    const scatter = read("src/components/home/MofDescriptor3DScatter.jsx")
    const explorer = read("src/components/home/HomeDataExplorer.jsx")
    expect(scatter).toContain("3.5 + (p.density == null ? 0.45 : (1 - norm01(p.density, extents.density)) * 3.2)")
    expect(scatter).toContain("r<sub>i</sub> = 3.5 + 3.2(1 − ρ<sub>i</sub><sup>*</sup>)")
    expect(explorer).toContain(String.raw`e_{B-1}\le x_i\le e_B`)
  })

  it("shows the same max-normalization used by the project-evolution graph", () => {
    const source = read("src/components/tabs/ProjectEvolutionTab.jsx")
    expect(source).toContain(String.raw`\mathcal{V}_k=N_{\mathrm{current},k}`)
    expect(source).toContain(String.raw`z_{t,j}=100\,\frac{x_{t,j}}{\max_{\tau}x_{\tau,j}}`)
    expect(source).toContain("numericCount(row[key]) / maxima[key] * 100")
  })
})
