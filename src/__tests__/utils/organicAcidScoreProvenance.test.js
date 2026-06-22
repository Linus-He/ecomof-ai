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
  buildFactorCompressionTrace,
  buildGuestScoreProvenance,
  buildHostScoreProvenance,
  buildRouteFactorComparisonModel,
  buildRouteHgcpsScoreProvenance,
  buildScoreDataGradeBadges,
  buildScoreSourceTableModel,
  buildStepWhyPanelEnhancedModel,
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
    expect(provenance.sourceFields.length).toBe(8)
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

  it("builds route HGCPS provenance with six multiplicative factors, final value, and rank", () => {
    const workbench = workbenchFromSource()
    const provenance = buildRouteHgcpsScoreProvenance(workbench)
    const topRoute = workbench.complementarity.topRoute

    expect(provenance.formulaType).toBe("multiplicative-factor")
    expect(provenance.rows).toHaveLength(6)
    expect(provenance.rows.map(row => row.fieldKey)).toEqual([
      "hostStability", "hostPathwaySupport", "guestActivityCompensation", "complementarity", "evidence", "riskRetentionFactor",
    ])
    expect(provenance.rank).toBe(topRoute.ranking)

    // finalValue equals the product of the six factors
    const product = provenance.rows.reduce((acc, row) => acc * row.weightOrFactor, 1)
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
    expect(trace.steps).toHaveLength(6)
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
    expect(model.factorRows).toHaveLength(6)
    expect(model.factorRows[0].values.length).toBe(model.routes.length)
    expect(model.autoSentenceZh).toMatch(/当前 #1 相比 #2 主要优势来自/)
    expect(model.topRouteId).toBe(workbench.complementarity.topRoute.routeId)
    noBadValues(model)
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
    expect(table.rows).toHaveLength(6)
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
    const model = buildStepWhyPanelEnhancedModel(step5, workbench, { lang: "zh" })
    expect(model.titleZh).toBe("为什么是这个结果？")
    expect(model.scoreQuestionZh).toBe("这个分数怎么算出来的？")
    expect(model.provenance.scoreName).toBe("routeHGCPS")
    expect(model.factorCompressionTrace.steps).toHaveLength(6)
    expect(model.routeFactorComparison.routes.length).toBeGreaterThanOrEqual(3)
    expect(model.whyNotOther.whyWinnerLeadsZh).toBeTruthy()
    expect(model.boundaries.some(row => row.zh.includes("实验验证优先级"))).toBe(true)
    noBadValues(model)
  })

  it("provides a terminology alignment model that keeps HGCPS primary", () => {
    const model = buildTerminologyAlignmentModel()
    expect(model.primaryScore).toBe("HGCPS")
    expect(model.firstMentionNoteZh).toMatch(/主客体互补路径评分/)
    expect(model.terms.map(term => term.acronym)).toEqual(expect.arrayContaining(["HGCPS", "OACS", "DMRS"]))
  })
})
