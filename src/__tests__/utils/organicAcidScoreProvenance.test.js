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
  buildDynamicWhyNotOtherExplanation,
  buildCounterfactual,
  buildFactorCompressionTrace,
  buildFactorDeltaTable,
  buildFactorEvidence,
  buildFinalResultSummaryModel,
  buildGuestScoreProvenance,
  buildHostScoreProvenance,
  buildPerFactorInterpretation,
  buildRiskDecomposition,
  buildRouteFactorComparisonModel,
  buildRouteHgcpsScoreProvenance,
  buildScoreDataGradeBadges,
  buildScoreSourceTableModel,
  buildStepWhyPanelEnhancedModel,
  buildStructuredConclusion,
  buildTerminologyAlignmentModel,
  deriveDataGrade,
} from "../../utils/organicAcidScoreProvenance"

const GRADES = ["seed", "proxy", "curated", "inferred"]

function source(overrides = {}) {
  return {
    pathwaySteps,
    pathwayDescriptorMap,
    hostMofCandidates,
    guestMetalCandidates,
    hostGuestRoutes,
    evidenceRiskRecords,
    validationExperiments,
    ...overrides,
  }
}

function workbenchFromSource(overrides = {}) {
  return buildOrganicAcidHostGuestWorkbench(source(overrides))
}

function noBadValues(value) {
  expect(JSON.stringify(value)).not.toMatch(/undefined|null|NaN/)
}

describe("organic acid score provenance builders", () => {
  it("builds host score provenance with raw / normalized / weight / contribution per source field", () => {
    const workbench = workbenchFromSource()
    const provenance = buildHostScoreProvenance(workbench)

    expect(provenance.scoreName).toBe("hostScore")
    expect(provenance.formulaType).toBe("weighted-sum")
    expect(provenance.headerNoteZh).toMatch(/不是催化性能预测值/)
    expect(provenance.sourceFields.length).toBe(10)
    expect(provenance.candidateLabel).toBe(workbench.hostSelection.selectedHost.displayName)
    for (const row of provenance.rows) {
      expect(typeof row.rawValue).toBe("number")
      expect(row.normalizedValue).toBeGreaterThanOrEqual(0)
      expect(row.normalizedValue).toBeLessThanOrEqual(1)
      expect(typeof row.weightOrFactor).toBe("number")
      expect(typeof row.contribution).toBe("number")
      expect(GRADES).toContain(row.dataGrade)
    }
    // weighted-sum of contributions reproduces the builder host score
    const summed = provenance.rows.reduce((sum, row) => sum + row.contribution, 0)
    expect(Math.abs(summed - provenance.finalValue)).toBeLessThan(0.01)
    noBadValues(provenance)
  })

  it("builds guest score provenance with seven weighted source fields", () => {
    const workbench = workbenchFromSource()
    const provenance = buildGuestScoreProvenance(workbench)

    expect(provenance.scoreName).toBe("guestScore")
    expect(provenance.sourceFields.length).toBe(7)
    expect(provenance.candidateLabel).toBe(workbench.guestSelection.selectedGuestMetal.guestMetal)
    expect(provenance.rows.every(row => typeof row.contribution === "number")).toBe(true)
    const summed = provenance.rows.reduce((sum, row) => sum + row.contribution, 0)
    expect(Math.abs(summed - provenance.finalValue)).toBeLessThan(0.01)
    noBadValues(provenance)
  })

  it("builds route HGCPS provenance with eight weighted-geometric factors, final value, and rank", () => {
    const workbench = workbenchFromSource()
    const provenance = buildRouteHgcpsScoreProvenance(workbench)
    const topRoute = workbench.complementarity.topRoute

    expect(provenance.formulaType).toBe("weighted-geometric-factor")
    expect(provenance.rows).toHaveLength(8)
    expect(provenance.rows.map(row => row.fieldKey)).toEqual([
      "hostStability", "hostPathwaySupport", "guestActivityCompensation", "complementarity", "evidence", "riskRetentionFactor", "synthesizability", "economics",
    ])
    expect(provenance.rank).toBe(topRoute.ranking)

    // finalValue equals the product of factor^weight terms
    const product = provenance.rows.reduce((acc, row) => acc * row.effectiveFactor, 1)
    expect(Math.abs(provenance.finalValue - product)).toBeLessThan(0.005)
    expect(provenance.finalValue).toBeCloseTo(topRoute.finalHGCPS, 2)

    // risk retention factor carries the dedicated explanation
    const riskRow = provenance.rows.find(row => row.fieldKey === "riskRetentionFactor")
    expect(riskRow.dataGrade).toBe("inferred")
    expect(riskRow.limitation).toMatch(/风险保留系数|risk-retention coefficient/)
    noBadValues(provenance)
  })

  it("builds a factor compression trace that starts at 1.0 and multiplies down to the final HGCPS", () => {
    const workbench = workbenchFromSource()
    const trace = buildFactorCompressionTrace(workbench)

    expect(trace.startValue).toBe(1)
    expect(trace.steps).toHaveLength(8)
    // cumulative is strictly non-increasing because every factor is <= 1
    let previous = trace.startValue
    for (const step of trace.steps) {
      expect(step.cumulativeValue).toBeLessThanOrEqual(previous + 1e-9)
      previous = step.cumulativeValue
    }
    expect(trace.steps[trace.steps.length - 1].cumulativeValue).toBeCloseTo(trace.finalHGCPS, 2)
    expect(trace.finalHGCPS).toBeCloseTo(workbench.complementarity.topRoute.finalHGCPS, 2)
    noBadValues(trace)
  })

  it("builds a route factor comparison model for top / runner-up / third routes", () => {
    const workbench = workbenchFromSource()
    const model = buildRouteFactorComparisonModel(workbench)

    expect(model.routes.length).toBeGreaterThanOrEqual(3)
    expect(model.routes[0].rank).toBe(1)
    expect(model.factorRows).toHaveLength(8)
    expect(model.factorRows[0].values.length).toBe(model.routes.length)
    expect(model.autoSentenceZh).toMatch(/当前 top route 相比 runner-up 主要优势来自/)
    expect(model.topRouteId).toBe(workbench.complementarity.topRoute.routeId)
    noBadValues(model)
  })

  it("builds per-factor interpretations and changes them when source factor data changes", () => {
    const base = buildHostScoreProvenance(workbenchFromSource())
    const alteredWorkbench = workbenchFromSource({
      hostMofCandidates: hostMofCandidates.map((host, index) => index === 0 ? { ...host, poreEnvironmentScore: 0.4 } : host),
    })
    const altered = buildHostScoreProvenance(alteredWorkbench)
    const baseRows = buildPerFactorInterpretation(base)
    const alteredRows = buildPerFactorInterpretation(altered)

    expect(baseRows).toHaveLength(base.rows.length)
    expect(baseRows[0]).toEqual(expect.objectContaining({ factorKey: expect.any(String), levelTag: expect.any(String), interpretationZh: expect.any(String) }))
    expect(alteredRows.find(row => row.factorKey === "poreEnvironmentScore").normalizedValue).not.toBe(baseRows.find(row => row.factorKey === "poreEnvironmentScore").normalizedValue)
    noBadValues(baseRows)
  })

  it("builds factor delta rows for top / runner-up / third routes and marks the dominant gap from data", () => {
    const workbench = workbenchFromSource()
    const routes = workbench.complementarity.routeScores
    const table = buildFactorDeltaTable(
      buildRouteHgcpsScoreProvenance(workbench, { route: routes[0] }),
      buildRouteHgcpsScoreProvenance(workbench, { route: routes[1] }),
      buildRouteHgcpsScoreProvenance(workbench, { route: routes[2] }),
    )
    const alteredWorkbench = workbenchFromSource({
      hostGuestRoutes: hostGuestRoutes.map((route, index) => index === 1 ? { ...route, hostGuestComplementarityScore: 0.45 } : route),
    })
    const alteredRoutes = alteredWorkbench.complementarity.routeScores
    const altered = buildFactorDeltaTable(
      buildRouteHgcpsScoreProvenance(alteredWorkbench, { route: alteredRoutes[0] }),
      buildRouteHgcpsScoreProvenance(alteredWorkbench, { route: alteredRoutes[1] }),
      buildRouteHgcpsScoreProvenance(alteredWorkbench, { route: alteredRoutes[2] }),
    )

    expect(table).toHaveLength(8)
    expect(table.filter(row => row.isDominantGap)).toHaveLength(1)
    expect(altered.find(row => row.factorKey === "complementarity").deltaSecond).not.toBe(table.find(row => row.factorKey === "complementarity").deltaSecond)
  })

  it("maps evidence records to factors without inventing citation or URLs", () => {
    const workbench = workbenchFromSource()
    const provenance = buildRouteHgcpsScoreProvenance(workbench)
    const evidence = buildFactorEvidence(provenance, evidenceRiskRecords, { routeId: provenance.routeId })

    expect(evidence.length).toBeGreaterThan(0)
    expect(evidence.some(row => row.factorKey !== "route-level")).toBe(true)
    expect(evidence[0]).toEqual(expect.objectContaining({ citation: expect.any(String), sourceUrl: expect.any(String), directness: expect.any(String), sameCondition: expect.any(Boolean) }))

    const pending = buildFactorEvidence(provenance, [], { routeId: provenance.routeId })
    expect(pending[0].citation).toBe("pending")
    expect(pending[0].limitation).toMatch(/pending/)
  })

  it("builds risk decomposition and one-factor counterfactual scenarios from white-box route factors", () => {
    const workbench = workbenchFromSource()
    const route = workbench.complementarity.topRoute
    const risk = buildRiskDecomposition(route, evidenceRiskRecords)
    const counterfactual = buildCounterfactual(route, workbench.complementarity.routeScores)

    expect(risk.riskRetention).toBe(route.scoreBreakdown.riskRetentionFactor)
    expect(risk.rows[0].explanationZh).toMatch(/Risk Retention/)
    expect(counterfactual).toHaveLength(8)
    const lowered = counterfactual[0].scenarios.find(row => row.setValue === 0.5)
    expect(lowered.newHGCPS).toBeLessThan(route.finalHGCPS)
    expect(lowered.newRank).toBeGreaterThanOrEqual(route.ranking)
    noBadValues({ risk, counterfactual })
  })

  it("derives dynamic why-not-other copy from real top vs runner-up factor differences", () => {
    const workbench = workbenchFromSource()
    const routes = workbench.complementarity.routeScores
    const explanation = buildDynamicWhyNotOtherExplanation(routes[0], routes[1], { kind: "route", dataGrade: "seed / proxy / curated" })

    expect(explanation.mainDifferenceFactor).toBeTruthy()
    expect(typeof explanation.differenceValue).toBe("number")
    expect(explanation.whyWinnerLeadsZh).toContain(routes[0].routeName)
    expect(explanation.whyWinnerLeadsZh).toMatch(/不是性能证明/)
    noBadValues(explanation)
  })

  it("changes the why-not-other copy when route factors change (not static)", () => {
    const baseWorkbench = workbenchFromSource()
    const baseRoutes = baseWorkbench.complementarity.routeScores
    const baseline = buildDynamicWhyNotOtherExplanation(baseRoutes[0], baseRoutes[1], { kind: "route" })

    const alteredRoutes = hostGuestRoutes.map((route, index) => index === 0
      ? { ...route, hostGuestComplementarityScore: 0.5, evidenceConfidenceScore: 0.5 }
      : route)
    const altered = buildDynamicWhyNotOtherExplanation(
      buildOrganicAcidHostGuestWorkbench(source({ hostGuestRoutes: alteredRoutes })).complementarity.routeScores[0],
      baseRoutes[1],
      { kind: "route" },
    )
    expect(altered.whyWinnerLeadsZh).not.toBe(baseline.whyWinnerLeadsZh)
  })

  it("does not hardcode Al-MOF / Mo / 0.416 — top route and HGCPS follow the data", () => {
    const alteredRoutes = hostGuestRoutes.map((route, index) => index === 3
      ? {
        ...route,
        hostStabilityScore: 0.99,
        hostPathwaySupportScore: 0.99,
        guestActivityCompensationScore: 0.99,
        hostGuestComplementarityScore: 0.99,
        evidenceConfidenceScore: 0.99,
        riskPenalty: 0.99,
      }
      : route)
    const workbench = buildOrganicAcidHostGuestWorkbench(source({ hostGuestRoutes: alteredRoutes }))
    const provenance = buildRouteHgcpsScoreProvenance(workbench)
    expect(provenance.candidateLabel).toContain(`${alteredRoutes[3].hostMof} + ${alteredRoutes[3].guestMetal}`)
    expect(provenance.routeId).toBe(alteredRoutes[3].routeId)
    expect(provenance.finalValue).not.toBe(0.416)
  })

  it("builds a collapsible score source table with all required columns", () => {
    const workbench = workbenchFromSource()
    const table = buildScoreSourceTableModel(buildRouteHgcpsScoreProvenance(workbench))
    expect(table.defaultCollapsed).toBe(true)
    expect(table.triggerZh).toBe("查看得分来源")
    expect(table.columns.map(col => col.key)).toEqual([
      "label", "rawValue", "normalizedValue", "weightOrFactor", "contribution", "cumulativeValue", "dataGrade", "dataSourceFile", "builderFunction", "limitation",
    ])
    expect(table.rows).toHaveLength(8)
    noBadValues(table)
  })

  it("derives data grade from provenance and exposes grade badges", () => {
    expect(deriveDataGrade(["data-backed seed route"])).toBe("seed")
    expect(deriveDataGrade(["local curated proxy"])).toBe("curated")
    expect(deriveDataGrade(["metal descriptor proxy"])).toBe("proxy")
    const badges = buildScoreDataGradeBadges(buildRouteHgcpsScoreProvenance(workbenchFromSource()))
    expect(badges.length).toBeGreaterThan(0)
    expect(badges.every(badge => GRADES.includes(badge.grade))).toBe(true)
  })

  it("assembles the enhanced step why panel model for step 5 with provenance, trace, comparison, and why-not", () => {
    const workbench = workbenchFromSource()
    const step5 = { id: "step-5", result: "Al-MOF + Mo 路线评分结论", dynamicChartModel: { type: "route-hgcps-breakdown" } }
    const model = buildStepWhyPanelEnhancedModel(step5, workbench, { lang: "zh", sourceData: source() })
    expect(model.titleZh).toBe("为什么是这个结果？")
    expect(model.scoreQuestionZh).toBe("这个分数怎么算出来的？")
    expect(model.provenance.scoreName).toBe("routeHGCPS")
    expect(model.factorCompressionTrace.steps).toHaveLength(8)
    expect(model.routeFactorComparison.routes.length).toBeGreaterThanOrEqual(3)
    expect(model.perFactorInterpretation).toHaveLength(8)
    expect(model.factorDeltaTable).toHaveLength(8)
    expect(model.factorEvidence.length).toBeGreaterThan(0)
    expect(model.counterfactual).toHaveLength(8)
    expect(model.whyNotOther.whyWinnerLeadsZh).toBeTruthy()
    expect(model.structuredConclusion.segments.map(row => row.labelZh)).toEqual(["结论", "依据", "关键因子", "局限"])
    expect(model.conclusionZh).toContain(String(model.provenance.rank))
    expect(model.boundaries.some(row => row.zh.includes("实验验证优先级"))).toBe(true)
    noBadValues(model)
  })

  it("builds structured conclusion segments and changes basis/key factor when data changes", () => {
    const baseWorkbench = workbenchFromSource()
    const baseModel = buildStepWhyPanelEnhancedModel({ id: "step-5", result: "baseline", dynamicChartModel: { type: "route-hgcps-breakdown" } }, baseWorkbench, { lang: "zh", sourceData: source() })
    const baseStructured = buildStructuredConclusion("step-5", baseModel.provenance, baseModel.factorDeltaTable, baseModel.riskDecomposition, baseModel.boundaries)
    const alteredRoutes = hostGuestRoutes.map((route, index) => index === 1
      ? {
        ...route,
        hostGuestComplementarityScore: 0.45,
        evidenceConfidenceScore: 0.42,
      }
      : route)
    const alteredWorkbench = workbenchFromSource({ hostGuestRoutes: alteredRoutes })
    const alteredModel = buildStepWhyPanelEnhancedModel({ id: "step-5", result: "altered", dynamicChartModel: { type: "route-hgcps-breakdown" } }, alteredWorkbench, { lang: "zh", sourceData: source({ hostGuestRoutes: alteredRoutes }) })

    expect(baseStructured.segments).toHaveLength(4)
    expect(baseStructured.segments.find(row => row.id === "basis").bodyZh).toMatch(/主要贡献来自/)
    expect(alteredModel.structuredConclusion.segments.find(row => row.id === "dominant-factor").bodyZh).not.toBe(baseModel.structuredConclusion.segments.find(row => row.id === "dominant-factor").bodyZh)
  })

  it("updates the dynamic step-5 conclusion and final summary when route scores change", () => {
    const baseWorkbench = workbenchFromSource()
    const baseStep = buildStepWhyPanelEnhancedModel({ id: "step-5", result: "baseline", dynamicChartModel: { type: "route-hgcps-breakdown" } }, baseWorkbench, { lang: "zh", sourceData: source() })
    const alteredRoutes = hostGuestRoutes.map((route, index) => index === 1
      ? {
        ...route,
        hostStabilityScore: 0.99,
        hostPathwaySupportScore: 0.99,
        guestActivityCompensationScore: 0.99,
        hostGuestComplementarityScore: 0.99,
        evidenceConfidenceScore: 0.99,
        riskPenalty: 0.99,
      }
      : route)
    const alteredWorkbench = workbenchFromSource({ hostGuestRoutes: alteredRoutes })
    const alteredStep = buildStepWhyPanelEnhancedModel({ id: "step-5", result: "altered", dynamicChartModel: { type: "route-hgcps-breakdown" } }, alteredWorkbench, { lang: "zh", sourceData: source({ hostGuestRoutes: alteredRoutes }) })
    const summary = buildFinalResultSummaryModel(alteredWorkbench, { sourceData: source({ hostGuestRoutes: alteredRoutes }) })

    expect(alteredStep.conclusionZh).not.toBe(baseStep.conclusionZh)
    expect(alteredStep.conclusionZh).toContain(alteredWorkbench.complementarity.topRoute.hostMof)
    expect(summary.routeId).toBe(alteredWorkbench.complementarity.topRoute.routeId)
    expect(summary.finalHGCPS).toBe(alteredWorkbench.complementarity.topRoute.finalHGCPS)
    expect(summary.routeComparisonModel.rows.length).toBeGreaterThanOrEqual(3)
    expect(summary.factorOverlayModel.top.routeId).toBe(summary.routeId)
    expect(summary.validationDonutModel.items.length).toBeGreaterThan(0)
    expect(summary.interpretationParagraphs.map(row => row.id)).toEqual(["why-leading", "risk-boundary", "next-experiment"])
  })

  it("provides a terminology alignment model that keeps HGCPS primary", () => {
    const model = buildTerminologyAlignmentModel()
    expect(model.primaryScore).toBe("HGCPS")
    expect(model.firstMentionNoteZh).toMatch(/主客体互补路径评分/)
    expect(model.terms.map(term => term.acronym)).toEqual(expect.arrayContaining(["HGCPS", "OACS", "DMRS"]))
  })
})
