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
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import reactionDataset from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import gasAdsorptionRecords from "../../../public/data/gas_adsorption_records_v1.json"
import literatureDataset from "../../../public/data/organic_acid_literature_dataset_v2.json"
import goldDataset from "../../../public/data/organic_acid_gold_dataset_v2.json"
import scoringSpecV1 from "../../../public/data/organic_acid_scoring_spec_v1.json"
import scoringSpecV2 from "../../../public/data/organic_acid_scoring_spec_v2.json"
import methodologyShowcase from "../../../public/data/organic_acid_methodology_showcase_v3_9_8.json"
import metalPriceTable from "../../../public/data/metal_precursor_cost_table.json"
import {
  buildAlgorithmShowcaseModel,
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
  coreMofImport,
  qmofImport,
  reactionDataset,
  gasAdsorptionRecords,
  literatureDataset,
  goldDataset,
}

describe("organic acid algorithm methodology", () => {
  it("builds dynamic Project Evolution methodology sections with required LaTeX formulas and boundaries", () => {
    const methodology = buildOrganicAcidAlgorithmMethodology(methodologyInput)

    expect(methodology.version).toBe("V3.9.8")
    expect(methodology.sections).toHaveLength(7)
    expect(methodology.dynamicContext.currentTopRoute).toMatch(/\+/)
    expect(methodology.dynamicContext.selectedHost).toBeTruthy()
    expect(methodology.dynamicContext.selectedGuest).toBeTruthy()
    expect(methodology.dynamicContext.hgcps).toBeGreaterThan(0)
    expect(methodology.dynamicContext.performanceClaimStatus).toBe("not final catalytic proof")
    expect(methodology.dynamicContext.mlReadinessStatus).toBe("not ready for formal machine learning")

    const latex = methodology.formulas.map(formula => formula.latex).join("\n")
    expect(latex).toContain("\\mathrm{HGCPS}")
    expect(latex).toContain("S_{\\mathrm{host}}")
    expect(latex).toContain("S_{\\mathrm{guest}}")
    expect(latex).toContain("r^{*}=\\arg\\max")
    expect(latex).not.toContain("h^{*}=\\mathrm{Al")
    expect(latex).not.toContain("g^{*}=\\mathrm{Mo")
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
    expect(formulaJson.formulas.find(row => row.id === "hgcps").latex).toContain("\\prod_{i=1}^{8}")
    expect(formulaJson.boundary).toMatch(/high-priority experimental hypothesis/)
    expect(latexSummary).toContain("\\[\\mathrm{Pathway}")
    expect(latexSummary).toContain("\\[\\mathrm{HGCPS}")
    expect(latexSummary).toContain("\\Delta_i")
    expect(latexSummary).toMatch(/not ready for formal machine learning/)
  })

  it("builds the formal eight-factor showcase with preregistration and audit conclusions", () => {
    const showcase = buildAlgorithmShowcaseModel({
      scoringSpecV1,
      scoringSpecV2,
      showcaseArtifact: methodologyShowcase,
      priceTable: metalPriceTable,
    })

    expect(showcase.version).toBe("V3.9.8")
    expect(showcase.factors).toHaveLength(8)
    expect(showcase.factors.map(row => row.dataGrade)).toEqual(expect.arrayContaining(["data-derived", "curated", "fallback"]))
    expect(showcase.formula.latex).toContain("\\prod_{i=1}^{8}")
    expect(showcase.formula.factorSetLatex).toContain("F_{\\mathrm{economics}}")
    expect(showcase.modelChange.reasonZh).toMatch(/分值整体塌缩/)
    expect(showcase.preregistration.map(row => row.commit)).toEqual(["6ccbbfa", "339041e"])
    expect(showcase.audit.composite.spearmanRho).toBe(methodologyShowcase.audit.proxyValidity.composite.spearmanRho)
    expect(showcase.audit.lowValidityDescriptors).toEqual(methodologyShowcase.audit.proxyValidity.lowValidityDescriptors)
    expect(showcase.audit.lowConfidenceFamilies).toContain("MIL-type host")
    expect(showcase.disciplineZh).toMatch(/规则先于排名/)
  })
})
