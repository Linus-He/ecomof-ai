import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import {
  buildAlgorithmFlowMarkdownSummary,
  buildCandidateCompetitionCsv,
  buildFlowNetworkExportJson,
  buildNodeInspectorModel,
  buildNodeInspectorSummaryJson,
  buildOrganicAcidAlgorithmFlowNetwork,
  buildRouteCompetitionCsv,
} from "../../utils/organicAcidAlgorithmFlow"

function sourceFixture() {
  return {
    pathwaySteps,
    pathwayDescriptorMap,
    hostMofCandidates,
    guestMetalCandidates,
    hostGuestRoutes,
    evidenceRiskRecords,
    validationExperiments,
  }
}

function networkFixture() {
  const source = sourceFixture()
  const workbench = buildOrganicAcidHostGuestWorkbench(source)
  return buildOrganicAcidAlgorithmFlowNetwork(workbench, source, { lang: "zh" })
}

describe("organicAcidAlgorithmFlow builders", () => {
  it("builds required node and edge types from Organic Acid host-guest data", () => {
    const network = networkFixture()
    const nodeTypes = new Set(network.nodes.map(node => node.type))
    const edgeTypes = new Set(network.edges.map(edge => edge.type))

    expect(network.version).toBe("V3.9.10")
    expect(network.statusBar.inputScale).toEqual({
      hostCandidates: 10,
      guestMetals: 12,
      routes: 25,
      evidenceRiskRecords: 58,
    })

    for (const type of ["pathway", "descriptor", "host", "guest", "route", "evidence", "risk", "validation"]) {
      expect(nodeTypes.has(type), `missing node type ${type}`).toBe(true)
    }

    for (const type of [
      "pathway step -> required descriptor",
      "descriptor -> host candidate",
      "descriptor -> guest metal",
      "host candidate -> host selection",
      "guest metal -> guest selection",
      "host + guest -> route candidate",
      "evidence -> route score",
      "risk -> risk retention factor",
      "route candidate -> validation experiment",
      "validation result -> feedback rule",
      "feedback rule -> HGCPS update preview",
    ]) {
      expect(edgeTypes.has(type), `missing edge type ${type}`).toBe(true)
    }

    expect(network.highlightedPaths.topPath).toContain("flow-host-host-al-mof")
    expect(network.highlightedPaths.topPath).toContain("flow-guest-mo")
    expect(network.highlightedPaths.topPath).toContain("flow-route-route-al-mof-mo")
    expect(network.highlightedPaths.backupPath.join(" ")).toMatch(/route-zr-mof-mo|route-al-mof-w/)
    expect(network.highlightedPaths.controlPath.join(" ")).toMatch(/route-al-mof-pristine/)
  })

  it("explains host, guest, and route competition without final-proof or ML overclaiming", () => {
    const network = networkFixture()
    const hosts = network.competition.hosts
    const guests = network.competition.guests
    const routes = network.competition.routes

    expect(hosts[0]).toEqual(expect.objectContaining({
      host: "Al-MOF",
      whySelectedZh: expect.stringMatching(/主体单项评分中排名第一/),
      whyNotSelectedZh: expect.stringMatching(/不是最终路线推荐/),
    }))
    expect(hosts.find(row => row.host === "Zr-MOF")?.whySelectedZh).toMatch(/条件候选/)
    expect(hosts.find(row => row.host === "Ti-MOF")?.whyNotSelectedZh).toMatch(/结构榜首/)
    expect(hosts.find(row => row.host === "Fe-MOF")?.whyNotSelectedZh).toMatch(/结构榜首/)
    expect(hosts.find(row => row.host === "Cu-MOF")?.whyNotSelectedZh).toMatch(/结构榜首/)

    expect(guests[0]).toEqual(expect.objectContaining({
      metal: "Mo",
      whySelectedZh: expect.stringMatching(/Mo 在客体竞争中胜出/),
      whyNotSelectedZh: expect.stringMatching(/Mo 引入可行性/),
    }))
    expect(guests.find(row => row.metal === "W")?.whySelectedZh).toMatch(/backup/)
    expect(guests.find(row => row.metal === "Fe")?.whySelectedZh).toMatch(/control \/ conditional/)
    expect(guests.find(row => row.metal === "Co")?.whySelectedZh).toMatch(/control \/ conditional/)
    expect(guests.find(row => row.metal === "Ni")?.whySelectedZh).toMatch(/control \/ conditional/)

    expect(routes[0]).toEqual(expect.objectContaining({
      route: "Al-MOF + Mo",
      whyRankedHereZh: expect.stringMatching(/加权几何 HGCPS 排名第一/),
      whyNotHigherZh: expect.stringMatching(/不是最终催化性能证明/),
    }))
    expect(routes.find(row => row.route === "Al-MOF + none / pristine")?.whyRankedHereZh).toMatch(/host-only control/)
    expect(routes.find(row => row.route === "Zr-MOF + Mo")?.whyRankedHereZh).toMatch(/host-framework control/)
    expect(routes.find(row => row.route === "Al-MOF + W")?.whyRankedHereZh).toMatch(/conditional route/)

    const serialized = JSON.stringify(network)
    expect(serialized).not.toMatch(/final best catalyst|ML predicted|catalytic performance verified|no-risk route/i)
    expect(serialized).not.toMatch(/NaN/)
  })

  it("exports flow JSON, inspector JSON, competition CSVs, and markdown summaries", () => {
    const network = networkFixture()
    const inspector = buildNodeInspectorModel("flow-route-route-al-mof-mo", network, network.workbench, "zh")
    const flowJson = buildFlowNetworkExportJson(network)
    const inspectorJson = buildNodeInspectorSummaryJson(inspector)
    const candidateCsv = buildCandidateCompetitionCsv(network)
    const routeCsv = buildRouteCompetitionCsv(network)
    const markdown = buildAlgorithmFlowMarkdownSummary(network)

    expect(flowJson.nodes.find(node => node.id === "flow-route-route-al-mof-mo")).toEqual(expect.objectContaining({
      labelZh: "Al-MOF + Mo",
      pathRole: "top",
    }))
    expect(inspectorJson).toEqual(expect.objectContaining({
      nodeId: "flow-route-route-al-mof-mo",
      evidenceStatus: expect.stringMatching(/Evidence confidence/),
      riskStatus: expect.stringMatching(/Risk retention/),
    }))
    expect(candidateCsv).toMatch(/type,rank,candidate,score/)
    expect(candidateCsv).toMatch(/host,1,Al-MOF/)
    expect(candidateCsv).toMatch(/guest,1,Mo/)
    expect(routeCsv).toMatch(/rank,route,hgcps/)
    expect(routeCsv).toMatch(/1,Al-MOF \+ Mo/)
    expect(markdown).toMatch(/# 有机酸算法链式网络 \/ Organic Acid Algorithm Flow Network/)
    expect(markdown).toMatch(/非最终催化性能证明/)
    expect(markdown).toMatch(/非正式机器学习推荐/)
  })
})
