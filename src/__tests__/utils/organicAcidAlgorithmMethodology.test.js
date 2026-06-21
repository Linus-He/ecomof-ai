// @ts-nocheck
import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import {
  buildOrganicAcidAlgorithmFormulaJson,
  buildOrganicAcidAlgorithmLatexSummary,
  buildOrganicAcidAlgorithmMethodology,
  buildOrganicAcidAlgorithmMethodologyMarkdown,
} from "../../utils/organicAcidAlgorithmMethodology"

const methodologyInput = {
  pathwaySteps,
  pathwayDescriptorMap,
  hostMofCandidates,
  guestMetalCandidates,
  hostGuestRoutes,
  evidenceRiskRecords,
  validationExperiments,
  activationReadinessSummary,
}

describe("organic acid algorithm methodology", () => {
  it("builds dynamic Project Evolution methodology sections with required LaTeX formulas and boundaries", () => {
    const methodology = buildOrganicAcidAlgorithmMethodology(methodologyInput)

    expect(methodology.version).toBe("V3.9.4")
    expect(methodology.sections).toHaveLength(7)
    expect(methodology.dynamicContext.currentTopRoute).toMatch(/Al-MOF \+ Mo/)
    expect(methodology.dynamicContext.selectedHost).toBe("Al-MOF")
    expect(methodology.dynamicContext.selectedGuest).toBe("Mo")
    expect(methodology.dynamicContext.hgcps).toBeGreaterThan(0)
    expect(methodology.dynamicContext.performanceClaimStatus).toBe("not final catalytic proof")
    expect(methodology.dynamicContext.mlReadinessStatus).toBe("not ready for formal machine learning")

    const latex = methodology.formulas.map(formula => formula.latex).join("\n")
    expect(latex).toContain("\\mathrm{HGCPS}")
    expect(latex).toContain("S_{\\mathrm{host}}")
    expect(latex).toContain("S_{\\mathrm{guest}}")
    expect(latex).toContain("r^{*}=\\arg\\max")
    expect(latex).toContain("\\pm20")
    expect(latex).toContain("\\Delta_i")
    expect(latex).toContain("F_{\\mathrm{evidence}}^{\\mathrm{new}}")
    expect(latex).toContain("\\mathrm{CO}_{2}")
    expect(latex).not.toMatch(/HGCPS = A \\* B \\* C/)
    expect(JSON.stringify(methodology)).not.toMatch(/undefined|null|NaN|Cat Playground/)
  })

  it("exports Markdown, Formula JSON, and LaTeX summary while preserving LaTeX formulas", () => {
    const methodology = buildOrganicAcidAlgorithmMethodology(methodologyInput)
    const markdown = buildOrganicAcidAlgorithmMethodologyMarkdown(methodology)
    const formulaJson = buildOrganicAcidAlgorithmFormulaJson(methodology)
    const latexSummary = buildOrganicAcidAlgorithmLatexSummary(methodology)

    expect(markdown).toMatch(/# Organic Acid Host-Guest Algorithm Methodology/)
    expect(markdown).toContain("\\[\\mathrm{HGCPS}")
    expect(markdown).toMatch(/not final catalytic proof/)
    expect(formulaJson.formulas.find(row => row.id === "hgcps").latex).toContain("F_{\\mathrm{risk\\ retention}}")
    expect(formulaJson.boundary).toMatch(/high-priority experimental hypothesis/)
    expect(latexSummary).toContain("\\[\\mathrm{Pathway}")
    expect(latexSummary).toContain("\\[\\mathrm{HGCPS}")
    expect(latexSummary).toContain("\\Delta_i")
    expect(latexSummary).toMatch(/not ready for formal machine learning/)
  })
})
