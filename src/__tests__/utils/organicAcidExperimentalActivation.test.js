// @ts-nocheck
import { describe, expect, it } from "vitest"
import specificAlMofHosts from "../../../public/data/organic_acid_experimental_activation/specific_al_mof_hosts.json"
import moIntroductionStrategies from "../../../public/data/organic_acid_experimental_activation/mo_introduction_strategies.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import experimentalValidationResultsTemplate from "../../../public/data/organic_acid_experimental_activation/experimental_validation_results_template.json"
import experimentalFeedbackRules from "../../../public/data/organic_acid_experimental_activation/experimental_feedback_rules.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import reactionDataset from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import gasAdsorptionRecords from "../../../public/data/gas_adsorption_records_v1.json"
import literatureDataset from "../../../public/data/organic_acid_literature_dataset_v2.json"
import goldDataset from "../../../public/data/organic_acid_gold_dataset_v2.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import {
  buildActivationReadinessJson,
  buildActivationReportMarkdown,
  buildExperimentalActivationWorkbench,
  buildExperimentalFeedbackRulesJson,
  buildExperimentalMatrixCsv,
  buildMoIntroductionStrategies,
  buildMoIntroductionStrategiesCsv,
  buildMoStrategyDecisionTree,
  buildSameConditionDataTemplate,
  buildSameConditionTemplateCsv,
  buildSameConditionTemplateJsonSchema,
  buildSpecificAlMofHostCandidates,
  buildSpecificAlMofHostsCsv,
  evaluateExperimentalResultAgainstRules,
} from "../../utils/organicAcidExperimentalActivation"

const input = {
  specificAlMofHosts,
  moIntroductionStrategies,
  minimumExperimentalMatrix,
  sameConditionDataTemplate,
  experimentalValidationResultsTemplate,
  experimentalFeedbackRules,
  activationReadinessSummary,
}

function topRouteFixture() {
  return buildOrganicAcidHostGuestWorkbench({
    pathwaySteps,
    pathwayDescriptorMap,
    hostMofCandidates,
    guestMetalCandidates,
    hostGuestRoutes,
    evidenceRiskRecords,
    validationExperiments,
    coreMofImport,
    qmofImport,
    reactionDataset,
    gasAdsorptionRecords,
    literatureDataset,
    goldDataset,
  }).complementarity.topRoute
}

describe("organic acid experimental activation package", () => {
  it("builds planning-ready host, Mo strategy, matrix, template, feedback, and readiness outputs", () => {
    const workbench = buildExperimentalActivationWorkbench(input, { topRoute: topRouteFixture() })

    expect(workbench.version).toBe("V3.9.4")
    expect(workbench.routeContext.routeId).toBe(topRouteFixture().routeId)
    expect(workbench.routeContext.topRouteName).toMatch(/\+/)
    expect(workbench.routeContext.hgcps).toBeGreaterThan(0)
    expect(workbench.hosts.primary.priorityTier).toBe("primary")
    expect(workbench.hosts.primary.provenance.length).toBeGreaterThan(0)
    expect(workbench.hosts.all.length).toBeGreaterThanOrEqual(3)
    expect(workbench.moStrategies.all.map(row => row.routeType)).toEqual(expect.arrayContaining([
      "post-synthetic modification",
      "doping during synthesis",
      "pore confinement / impregnation route",
    ]))
    expect(workbench.minimumExperimentalMatrix.all.length).toBeGreaterThanOrEqual(6)
    expect(workbench.minimumExperimentalMatrix.coverage).toEqual(expect.objectContaining({
      includesBlank: true,
      includesPristineAlMof: true,
      includesAlMofMo: true,
      includesGuestControl: true,
      includesZrMofMo: true,
      includesMoOnly: true,
    }))
    expect(workbench.sameConditionDataTemplate.fields.every(field => field.fieldName && field.label && field.dataType && field.whyNeeded && field.affectsAlgorithmFactor)).toBe(true)
    expect(workbench.experimentalValidationResultTemplate.hasRealResults).toBe(false)
    expect(workbench.feedbackRules.rules).toHaveLength(6)
    expect(workbench.readiness).toEqual(expect.objectContaining({
      currentStage: "experimental planning ready",
      readinessLevel: "planning-ready / not performance-validated",
      canUseForInternalDiscussion: true,
      canUseForExperimentPlanning: true,
      canUseForPerformanceClaim: false,
      canUseForMachineLearning: false,
    }))
    expect(JSON.stringify(workbench)).not.toMatch(/undefined|null|NaN/)
    expect(JSON.stringify(workbench)).not.toMatch(/final best catalyst|Cat Playground/i)
  })

  it("builds decision tree, exports, JSON schema, and feedback evaluation without completed-result claims", () => {
    const hosts = buildSpecificAlMofHostCandidates(specificAlMofHosts)
    const strategies = buildMoIntroductionStrategies(moIntroductionStrategies)
    const decisionTree = buildMoStrategyDecisionTree(strategies.all)
    const template = buildSameConditionDataTemplate(sameConditionDataTemplate)
    const workbench = buildExperimentalActivationWorkbench(input, { topRoute: topRouteFixture() })

    expect(decisionTree.map(row => row.condition)).toEqual([
      "low synthesis risk / first activation",
      "stronger host-guest synergy required",
      "fast validation / rapid Mo exposure check",
    ])
    expect(buildSpecificAlMofHostsCsv(hosts)).toMatch(/MIL-53\(Al\)-like/)
    expect(buildMoIntroductionStrategiesCsv(strategies)).toMatch(/Mo post-synthetic modification/)
    expect(buildExperimentalMatrixCsv(workbench.minimumExperimentalMatrix)).toMatch(/Blank control/)
    expect(buildSameConditionTemplateCsv(template)).toMatch(/affects algorithm factor/)
    const schema = buildSameConditionTemplateJsonSchema(template)
    expect(schema.required).toContain("experimentId")
    expect(schema.properties.routeId.description).toMatch(/host-guest complementarity/)
    expect(JSON.stringify(buildExperimentalFeedbackRulesJson(workbench.feedbackRules))).toMatch(/feedback-rule-supported-yield-structure/)
    expect(JSON.stringify(buildActivationReadinessJson(workbench.readiness))).toMatch(/not performance-validated/)
    expect(buildActivationReportMarkdown(workbench)).toMatch(/Not final catalytic proof/)

    const evaluation = evaluateExperimentalResultAgainstRules({
      validationOutcome: "inconclusive",
      carbonBalance: 0.62,
    }, workbench.feedbackRules.rules)
    expect(evaluation.outcome).toBe("inconclusive")
    expect(evaluation.updateBoundary).toMatch(/Do not force reranking/)
    expect(evaluation.matchedRules.map(row => row.ruleId).join(" ")).toMatch(/carbon|inconclusive/)
  })
})
