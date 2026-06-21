// @ts-nocheck
import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import {
  buildAlgorithmTraceJson,
  buildHostGuestComplementarityScore,
  buildHostGuestRouteExplanationJson,
  buildHostGuestRoutePriorityQueueCsv,
  buildOrganicAcidHostGuestWorkbench,
  buildPathwayDescriptorMapCsv,
} from "../../utils/organicAcidHostGuest"

const input = {
  pathwaySteps,
  pathwayDescriptorMap,
  hostMofCandidates,
  guestMetalCandidates,
  hostGuestRoutes,
  evidenceRiskRecords,
  validationExperiments,
}

describe("organic acid host-guest pathway screening", () => {
  it("builds the V3.9.2 pathway pipeline from seed data", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.version).toBe("V3.9.2")
    expect(workbench.pipelineSteps).toHaveLength(6)
    expect(workbench.pathwaySteps.length).toBeGreaterThanOrEqual(7)
    expect(workbench.pathwaySteps.find(step => step.stepId === "step-co2-activation").mappedDescriptors).toContain("Lewis acidity")
    expect(workbench.descriptorMap.find(row => row.stepId === "step-hcoo-stabilization").descriptorGroup).toMatch(/Formate intermediate/)
  })

  it("selects Al-MOF as stable host and Mo as activity-compensation guest from ranking builders", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.hostSelection.selectedHost.displayName).toBe("Al-MOF")
    expect(workbench.hostSelection.selectedHost.hostRole).toMatch(/stable host framework/)
    expect(workbench.hostSelection.hostRoleExplanation).toMatch(/not treated as a standalone best catalyst/)
    expect(workbench.guestSelection.selectedGuestMetal.guestMetal).toBe("Mo")
    expect(workbench.guestSelection.selectedGuestMetal.role).toMatch(/guest \/ dopant \/ activity compensation metal/)
    expect(workbench.guestSelection.guestRoleExplanation).toMatch(/complements the host instead of replacing it/)
  })

  it("ranks Al-MOF + Mo first by HGCPS and keeps score and risk breakdowns explainable", () => {
    const complementarity = buildHostGuestComplementarityScore(hostGuestRoutes, evidenceRiskRecords)
    const top = complementarity.topRoute

    expect(top.routeId).toBe("route-al-mof-mo")
    expect(top.hostMof).toBe("Al-MOF")
    expect(top.guestMetal).toBe("Mo")
    expect(top.finalHGCPS).toBeGreaterThan(complementarity.routeScores[1].finalHGCPS)
    expect(Object.keys(top.scoreBreakdown)).toEqual([
      "hostStability",
      "hostPathwaySupport",
      "guestActivityCompensation",
      "complementarity",
      "evidence",
      "riskPenalty",
    ])
    expect(top.riskPenaltyBreakdown.length).toBeGreaterThan(0)
    expect(top.riskPenaltyBreakdown.every(row => row.reason && row.riskType)).toBe(true)
  })

  it("builds route queue, explanation, trace, graph, evidence, validation, and export payloads", () => {
    const workbench = buildOrganicAcidHostGuestWorkbench(input)

    expect(workbench.priorityQueue.topPriority[0].routeId).toBe("route-al-mof-mo")
    expect(workbench.selectedRouteExplanation.hostMof).toBe("Al-MOF")
    expect(workbench.selectedRouteExplanation.guestMetal).toBe("Mo")
    expect(workbench.selectedRouteExplanation.evidenceSources.length).toBeGreaterThan(0)
    expect(workbench.selectedRouteExplanation.nextValidationExperiment).toMatch(/Al-MOF host/)
    expect(workbench.algorithmTrace.map(step => step.title)).toEqual([
      "Load pathway steps",
      "Map descriptors to each pathway step",
      "Screen host MOF candidates",
      "Select Al-MOF as host framework",
      "Screen guest / dopant metals",
      "Select Mo as high-priority guest metal",
      "Calculate host-guest complementarity score",
      "Generate Al-MOF + Mo experimental route",
    ])
    expect(workbench.knowledgeGraph.nodes.map(node => node.type)).toEqual(expect.arrayContaining([
      "pathway step",
      "descriptor",
      "host MOF",
      "guest metal",
      "host-guest route",
      "evidence",
      "risk",
      "validation experiment",
    ]))
    expect(workbench.evidenceMatrix.some(row => row.evidenceType === "missing")).toBe(true)
    expect(workbench.validationExperiments).toBeUndefined()
    expect(workbench.experimentalRoute.experiments.filter(row => row.routeId === "route-al-mof-mo").length).toBeGreaterThanOrEqual(7)

    expect(buildHostGuestRoutePriorityQueueCsv(workbench.priorityQueue)).toMatch(/Al-MOF,Mo/)
    expect(buildPathwayDescriptorMapCsv(workbench.descriptorMap)).toMatch(/CO2 activation/)
    expect(buildHostGuestRouteExplanationJson(workbench.selectedRouteExplanation)).toEqual(expect.objectContaining({
      version: "V3.9.2",
      targetProduct: "formic acid / organic acid",
      hostMof: "Al-MOF",
      guestMetal: "Mo",
    }))
    expect(buildAlgorithmTraceJson(workbench.algorithmTrace).trace).toHaveLength(8)
    expect(JSON.stringify(workbench)).not.toMatch(/undefined|null|NaN/)
  })
})
