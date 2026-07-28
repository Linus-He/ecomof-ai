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
import oldRerun from "../../../public/data/organic_acid_rerun_v3_9_7.json"
import currentRerun from "../../../public/data/organic_acid_rerun_v3_9_8.json"
import rankingLog from "../../../public/data/organic_acid_ranking_evolution_log.json"
import { buildDescriptorAblation } from "../../utils/organicAcidDataDerivation/descriptorAblation"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"

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

describe("organic acid descriptor ablation", () => {
  it("derives four fixed-weight layers, rank deltas, and eight logarithmic contributions", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)
    const ablation = workbench.descriptorAblation

    expect(ablation.layers.map(layer => layer.id)).toEqual(["L0", "L1", "L2", "L3"])
    expect(ablation.layers.every(layer => layer.candidates.length === workbench.complementarity.routeScores.length)).toBe(true)
    expect(ablation.candidates.every(candidate => candidate.evolution.length === 4)).toBe(true)
    expect(ablation.candidates.every(candidate => candidate.contributions.length === 8)).toBe(true)

    const candidate = ablation.candidates[0]
    const contribution = candidate.contributions[0]
    const expected = contribution.weight * Math.log(Math.max(scoringSpec.algorithm.zeroFloor, contribution.factorValue))
    expect(contribution.logContribution).toBeCloseTo(expected, 4)
    expect(candidate.evolution.slice(1).every(row => Number.isFinite(row.rankDelta))).toBe(true)
    expect(ablation.impactSummary.summaryZh).toMatch(/经济性/)
  })

  it("produces different L3 rankings for different factor data while preserving earlier layers", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)
    const baseline = buildDescriptorAblation(workbench.complementarity.routeScores)
    const changedRoutes = workbench.complementarity.routeScores.map((route, index) => index === 0
      ? { ...route, economicScore: 0.001 }
      : route)
    const changed = buildDescriptorAblation(changedRoutes)

    expect(changed.layers[0].candidates.map(row => row.routeId)).toEqual(baseline.layers[0].candidates.map(row => row.routeId))
    expect(changed.layers[1].candidates.map(row => row.routeId)).toEqual(baseline.layers[1].candidates.map(row => row.routeId))
    expect(changed.layers[2].candidates.map(row => row.routeId)).toEqual(baseline.layers[2].candidates.map(row => row.routeId))
    expect(changed.layers[3].candidates.map(row => row.routeId)).not.toEqual(baseline.layers[3].candidates.map(row => row.routeId))
  })

  it("records the real-price and real-corpus rerun honestly when the previous leader changes", () => {
    const oldById = new Map(oldRerun.routeRanking.map(row => [row.routeId, row]))
    const changedRankRoutes = currentRerun.routeRanking.filter(row => oldById.get(row.routeId)?.ranking !== row.ranking)
    const oldLeader = oldRerun.routeRanking[0]
    const currentLeader = currentRerun.routeRanking.find(row => row.routeId === oldLeader.routeId)
    const realPriceStage = rankingLog.stages.find(stage => stage.version === "V3.9.8")

    expect(changedRankRoutes.length).toBeGreaterThan(0)
    expect(currentLeader.ranking).toBeGreaterThan(1)
    expect(currentRerun.routeRanking[0].routeId).not.toBe(oldLeader.routeId)
    expect(currentLeader.scoreBreakdown.economics).toBeLessThan(oldLeader.scoreBreakdown.economics)
    expect(currentLeader.finalHGCPS).toBeLessThan(oldLeader.finalHGCPS)
    expect(realPriceStage.top5Routes[0].routeId).toBe(currentRerun.routeRanking[0].routeId)
    expect(realPriceStage.top5Routes[0].score).toBe(currentRerun.routeRanking[0].finalHGCPS)
  })
})
