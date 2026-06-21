// @ts-nocheck
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const exists = (rel: string) => fs.existsSync(path.join(process.cwd(), rel))
const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), "utf8")

describe("V3.9 cat playground removed", () => {
  it("deletes the cat-playground component, mascot, model, demo data, and test", () => {
    const removed = [
      "src/components/catalysis/CatalysisEnergyBarrierDemo.jsx",
      "src/components/catalysis/CatalystCatSprite.jsx",
      "src/components/catalysis/CatEnergyCurve.jsx",
      "src/components/catalysis/CatEffectContributionPanel.jsx",
      "src/components/catalysis/CatScienceMetricsPanel.jsx",
      "src/components/catalysis/DescriptorTreatChips.jsx",
      "src/components/catalysis/catEnergyModel.js",
      "src/__tests__/utils/catEnergyModel.test.js",
      "public/data/cat_energy_descriptors_demo.json",
      "public/data/cat_energy_pathways_demo.json",
    ]
    for (const f of removed) expect(exists(f), `${f} should be deleted`).toBe(false)
  })

  it("Catalysis Lab no longer imports/renders the energy-barrier demo and shows a research overview", () => {
    const src = read("src/components/tabs/CatalysisLabTab.tsx")
    expect(src).not.toMatch(/CatalysisEnergyBarrierDemo/)
    expect(src).toMatch(/Catalysis Research Overview/)
  })

  it("index.css contains no orphaned cat-playground selectors or keyframes (but keeps shared .formula)", () => {
    const css = read("src/index.css")
    const catPatterns = [
      "cat-playground", "energy-playground", "catalysis-energy-svg", "cat-energy", "energy-cat",
      "catalyst-curve", "cat-zone", "cat-note", "cat-spark", "cat-contribution", "cat-probe",
      "catalysis-cat", "descriptor-treat", "cat-gentle-hop", "cat-spark-pulse", "catalysis-curve-pulse",
    ]
    for (const p of catPatterns) expect(css.includes(p), `index.css still references "${p}"`).toBe(false)
    // shared / generic styles must survive the cleanup
    expect(css).toMatch(/\.formula\s*\{/)
    expect(css).toMatch(/mof-cube-breathe/)
    expect(css).toMatch(/\.mof-cube-node/)
  })
})
