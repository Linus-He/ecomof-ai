// @ts-nocheck
import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import reactionDataset from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import gasAdsorptionRecords from "../../../public/data/gas_adsorption_records_v1.json"
import literatureDataset from "../../../public/data/organic_acid_literature_dataset_v2.json"
import goldDataset from "../../../public/data/organic_acid_gold_dataset_v2.json"
import scoringSpec from "../../../public/data/organic_acid_scoring_spec_v2.json"
import {
  buildAlgorithmTraceJson,
  buildAblationAnalysisJson,
  buildEvidenceMatrixCsv,
  buildHostGuestComplementarityScore,
  buildHostGuestRouteExplanationJson,
  buildHostGuestRoutePriorityQueueCsv,
  buildMarkdownResearchSummary,
  buildMissingEvidenceRiskMatrixCsv,
  buildOrganicAcidExperimentalRouteJson,
  buildOrganicAcidHostGuestWorkbench,
  buildOrganicAcidRouteReportJson,
  buildPathwayDescriptorMapCsv,
  buildSensitivityAnalysisJson,
  HGCPS_FORMULA_TEXT,
  clearOrganicAcidDerivationCaches,
  getOrganicAcidDerivationCacheStats,
} from "../../utils/organicAcidHostGuest"

const input = {
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
}

describe("organic acid host-guest pathway screening", () => {
  it("builds the V3.9.7 pathway pipeline from the preregistered descriptor expansion", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.version).toBe("V3.9.7")
    expect(workbench.scoringSpec.specId).toBe(scoringSpec.specId)
    expect(workbench.pipelineSteps).toHaveLength(6)
    expect(hostMofCandidates.length).toBeGreaterThanOrEqual(8)
    expect(guestMetalCandidates.length).toBeGreaterThanOrEqual(8)
    expect(hostGuestRoutes.length).toBeGreaterThanOrEqual(20)
    expect(evidenceRiskRecords.length).toBeGreaterThanOrEqual(50)
    expect(workbench.pathwaySteps.length).toBeGreaterThanOrEqual(7)
    expect(workbench.pathwaySteps.find(step => step.stepId === "step-co2-activation").mappedDescriptors).toContain("Lewis acidity")
    expect(workbench.descriptorMap.find(row => row.stepId === "step-hcoo-stabilization").descriptorGroup).toMatch(/Formate intermediate/)
    expect(workbench.familyAssignmentSummary.byDataset.coreMof.targetCounts["Al-MOF"]).toBeGreaterThan(0)
    expect(workbench.familyAssignmentSummary.byDataset.reaction.targetCounts["Zr-MOF"]).toBeGreaterThan(0)
  })

  it("selects host and guest from ranking builders without using precomputed total scores", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.hostSelection.selectedHost.displayName).toBeTruthy()
    expect(workbench.hostSelection.hostRoleExplanation).toMatch(/host-only structural leader/)
    expect(workbench.hostSelection.hostRoleExplanation).toMatch(/not automatically the final route recommendation/)
    expect(workbench.guestSelection.selectedGuestMetal.guestMetal).toBeTruthy()
    expect(workbench.guestSelection.selectedGuestMetal.role).toMatch(/guest \/ dopant \/ activity compensation metal/)
    expect(workbench.guestSelection.guestRoleExplanation).toMatch(/complements the host instead of replacing it/)
    expect(hostMofCandidates.some(row => Object.hasOwn(row, "hostScore"))).toBe(false)
    expect(guestMetalCandidates.some(row => Object.hasOwn(row, "guestScore"))).toBe(false)
    expect(workbench.hostSelection.rankedHosts.find(row => row.displayName === "Al-MOF").factorProvenance.poreEnvironmentScore.sourceDataset).toMatch(/CoRE\+QMOF/)
    expect(workbench.hostSelection.rankedHosts.find(row => row.displayName === "Al-MOF").factorProvenance.ligandPathwaySupport.derivationLevel).toMatch(/curated-ligand-descriptor|fallback/)
    expect(workbench.hostSelection.rankedHosts.find(row => row.displayName === "Ti-MOF").factorProvenance.synthesizabilityScore.derivationLevel).toMatch(/frequency proxy/)
    expect(workbench.guestSelection.selectedGuestMetal.factorProvenance.co2ActivationScore.derivationLevel).toMatch(/data-derived|fallback/)
  })

  it("ranks routes by derived HGCPS and keeps score and provenance breakdowns explainable", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)
    const complementarity = workbench.complementarity
    const top = complementarity.topRoute

    expect(top.routeId).toBeTruthy()
    expect(hostGuestRoutes.some(row => Object.hasOwn(row, "finalHGCPS") || Object.hasOwn(row, "ranking"))).toBe(false)
    expect(top.finalHGCPS).toBeGreaterThan(complementarity.routeScores[1].finalHGCPS)
    expect(HGCPS_FORMULA_TEXT).toMatch(/weighted geometric mean/)
    expect(top.finalHGCPS).toBeCloseTo(
      Number(Math.exp(scoringSpec.routeScoreWeights.reduce((sum, [key, weight]) => (
        sum + weight * Math.log(Math.max(scoringSpec.algorithm.zeroFloor, top[key]))
      ), 0)).toFixed(3)),
      3
    )
    expect(Object.keys(top.scoreBreakdown)).toEqual([
      "hostStability",
      "hostPathwaySupport",
      "guestActivityCompensation",
      "complementarity",
      "evidence",
      "riskRetentionFactor",
      "synthesizability",
      "economics",
    ])
    expect(top.scoreBreakdown.riskRetentionFactor).toBeGreaterThan(0)
    expect(top.scoreBreakdown.riskPenalty).toBeUndefined()
    expect(top.riskPenaltyBreakdown.length).toBeGreaterThan(0)
    expect(top.riskPenaltyBreakdown.every(row => row.reason && row.riskType)).toBe(true)
    expect(Object.keys(top.routeFactorProvenance)).toEqual(scoringSpec.routeScoreKeys)
    expect(Object.values(top.routeFactorProvenance).every(tuple => tuple.sourceDataset && Number.isFinite(tuple.nRecords) && tuple.rawAggregate && tuple.normalization)).toBe(true)
    expect(complementarity.whyTopRanked).toMatch(/weighted-geometric HGCPS/)
    expect(complementarity.whyTopRanked).toMatch(/risk retention factor/)
  })

  it("builds route queue, explanation, trace, graph, risk, sensitivity, ablation, validation, and export payloads", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.priorityQueue.topPriority[0].routeId).toBe(workbench.complementarity.topRoute.routeId)
    expect(workbench.selectedRouteExplanation.hostMof).toBe(workbench.complementarity.topRoute.hostMof)
    expect(workbench.selectedRouteExplanation.guestMetal).toBe(workbench.complementarity.topRoute.guestMetal)
    expect(workbench.selectedRouteExplanation.evidenceSources.length).toBeGreaterThan(0)
    expect(workbench.selectedRouteExplanation.nextValidationExperiment).toBeTruthy()
    expect(workbench.algorithmTrace.map(step => step.title)).toEqual(expect.arrayContaining([
      "Load pathway steps",
      "Map descriptors to each pathway step",
      "Screen host MOF candidates",
      "Screen guest / dopant metals",
      "Calculate host-guest complementarity score",
    ]))
    expect(workbench.algorithmTrace.find(step => step.id.startsWith("select-") && step.id.endsWith("-host"))?.title).toContain(workbench.hostSelection.selectedHost.displayName)
    expect(workbench.algorithmTrace.find(step => step.id.startsWith("select-") && step.id.endsWith("-guest"))?.title).toContain(workbench.guestSelection.selectedGuestMetal.guestMetal)
    expect(workbench.knowledgeGraph.nodes.map(node => node.type)).toEqual(expect.arrayContaining([
      "pathway step",
      "descriptor",
      "host MOF",
      "guest metal",
      "host-guest route",
      "evidence",
      "risk",
    ]))
    expect(workbench.evidenceMatrix.some(row => row.evidenceType === "missing")).toBe(true)
    expect(workbench.missingEvidenceRiskMatrix.find(row => row.routeId === workbench.complementarity.topRoute.routeId)).toEqual(expect.objectContaining({
      hydrothermalStabilityRisk: "170C aqueous stability must be tested",
      missingSameConditionExperiment: "same-condition experiment is still needed",
    }))
    expect(workbench.sensitivityAnalysis.summary.rankStability).toBeGreaterThanOrEqual(0.8)
    expect(workbench.sensitivityAnalysis.summary.topRouteRemainsTop).toBe(true)
    expect(workbench.sensitivityAnalysis.scenarios).toHaveLength(18)
    expect(workbench.sensitivityAnalysis.scenarios.every(row => row.baselineTopRoute === workbench.complementarity.topRoute.routeId)).toBe(true)
    expect(workbench.sensitivityAnalysis.candidateRankDistributions.map(row => row.hostMof)).toEqual([
      "Al-MOF",
      "Ti-MOF",
      "MIL-type host",
    ])
    expect(workbench.sensitivityAnalysis.summary.topRouteFlipFrequency).toBeGreaterThanOrEqual(0)
    expect(workbench.ablationAnalysis.scenarios.map(row => row.scenarioId)).toEqual(expect.arrayContaining([
      "without-guest-activity-compensation",
      "without-host-guest-complementarity",
      "pristine-host-only",
      "guest-contribution-removed",
    ]))
    expect(workbench.ablationAnalysis.moContribution.contribution).toBeGreaterThan(0)
    expect(workbench.ablationAnalysis.hostStabilityContribution.contribution).toBeGreaterThan(0)
    expect(workbench.validationExperiments).toBeUndefined()
    expect(workbench.experimentalRoute.routeId).toBe(workbench.complementarity.topRoute.routeId)
    expect(workbench.experimentalRoute.nextExperiment).toBeTruthy()

    expect(buildHostGuestRoutePriorityQueueCsv(workbench.priorityQueue)).toMatch(workbench.complementarity.topRoute.hostMof)
    expect(buildEvidenceMatrixCsv(workbench.evidenceMatrix)).toMatch(/same-condition/)
    expect(buildMissingEvidenceRiskMatrixCsv(workbench.missingEvidenceRiskMatrix)).toMatch(/Mo introduction feasibility needs validation/)
    expect(buildPathwayDescriptorMapCsv(workbench.descriptorMap)).toMatch(/CO2 activation/)
    expect(buildHostGuestRouteExplanationJson(workbench.selectedRouteExplanation)).toEqual(expect.objectContaining({
      version: "V3.9.7",
      targetProduct: "formic acid / organic acid",
      hostMof: workbench.complementarity.topRoute.hostMof,
      guestMetal: workbench.complementarity.topRoute.guestMetal,
    }))
    expect(buildOrganicAcidRouteReportJson(workbench, workbench.selectedRouteExplanation)).toEqual(expect.objectContaining({
      version: "V3.9.7",
      hgcpsFormula: HGCPS_FORMULA_TEXT,
      limitationStatement: "This is a high-priority experimental route, not final catalytic performance proof.",
    }))
    expect(buildSensitivityAnalysisJson(workbench.sensitivityAnalysis).sensitivityAnalysis.summary.topRouteRemainsTop).toBe(true)
    expect(buildAblationAnalysisJson(workbench.ablationAnalysis).ablationAnalysis.summary).toMatch(/weighted-geometric HGCPS/)
    expect(buildOrganicAcidExperimentalRouteJson(workbench.experimentalRoute).nextValidationExperiment).toBeTruthy()
    expect(buildMarkdownResearchSummary(workbench, workbench.selectedRouteExplanation)).toMatch(/Random Forest is only a baseline \/ risk reference/)
    expect(buildAlgorithmTraceJson(workbench.algorithmTrace).trace).toHaveLength(8)
    expect(JSON.stringify(workbench)).not.toMatch(/undefined|NaN/)
    expect(JSON.stringify(workbench.complementarity.routeScores.map(route => route.scoreBreakdown))).not.toMatch(/undefined|null|NaN/)
    expect(JSON.stringify(workbench)).not.toMatch(/final best catalyst|already proved|Cat Playground/i)
  }, 10000)

  it("changes derived host scores when source CoRE descriptors change", () => {
    const baseline = buildOrganicAcidHostGuestWorkbench(input)
    const selectedFamily = "Al-MOF"
    const changedCore = {
      ...coreMofImport,
      records: coreMofImport.records.map(record => record.metalNode === "Al"
        ? { ...record, surfaceArea: Number(record.surfaceArea || 0) * 0.1, voidFraction: Number(record.voidFraction || 0) * 0.1 }
        : record),
    }
    const changed = buildOrganicAcidHostGuestWorkbench({ ...input, coreMofImport: changedCore })
    const baselineHost = baseline.hostSelection.rankedHosts.find(row => row.family === selectedFamily)
    const changedHost = changed.hostSelection.rankedHosts.find(row => row.family === selectedFamily)

    expect(changedHost.hostScoreBreakdown.poreEnvironmentScore).not.toBe(baselineHost.hostScoreBreakdown.poreEnvironmentScore)
  })

  it("uses the top HGCPS route as the final recommendation and exposes host divergence", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)
    const topRoute = workbench.complementarity.topRoute

    expect(workbench.recommendation.hostFramework).toBe(topRoute.hostMof)
    expect(workbench.recommendation.guestDopantMetal).toBe(topRoute.guestMetal)
    expect(workbench.recommendation.topStructuralHost).toBe(workbench.hostSelection.selectedHost.displayName)
    expect(workbench.recommendation.topRouteHost).toBe(topRoute.hostMof)
    expect(workbench.recommendation.hostSelectionExplanation).toBeTruthy()
  })

  it("memoizes repeated derivation for the same dataset references and stays below the performance guard", () => {
    clearOrganicAcidDerivationCaches()
    const startedAt = performance.now()
    const first = buildOrganicAcidHostGuestWorkbench(input)
    const firstDuration = performance.now() - startedAt
    const secondStartedAt = performance.now()
    const second = buildOrganicAcidHostGuestWorkbench(input)
    const secondDuration = performance.now() - secondStartedAt
    const stats = getOrganicAcidDerivationCacheStats()

    expect(firstDuration).toBeLessThan(2000)
    expect(secondDuration).toBeLessThan(50)
    expect(second).toBe(first)
    expect(stats.workbench.computations).toBe(1)
    expect(stats.workbench.hits).toBe(1)
    expect(stats.hostFactors.computations).toBe(1)
    expect(stats.routeFactors.computations).toBe(1)
  })
})
