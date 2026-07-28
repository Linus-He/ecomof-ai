import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import specificAlMofHosts from "../../../public/data/organic_acid_experimental_activation/specific_al_mof_hosts.json"
import moIntroductionStrategies from "../../../public/data/organic_acid_experimental_activation/mo_introduction_strategies.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import experimentalValidationResultsTemplate from "../../../public/data/organic_acid_experimental_activation/experimental_validation_results_template.json"
import experimentalFeedbackRules from "../../../public/data/organic_acid_experimental_activation/experimental_feedback_rules.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"
import {
  buildGuestRankingChartModel,
  buildHostRankingChartModel,
  buildObjectiveInputOutputChartModel,
  buildPathwayCoverageChartModel,
  buildPredictionObjectiveStep,
  buildRouteHgcpsBreakdownChartModel,
  buildStepDynamicChartModel,
  buildStepwiseExecutionChain,
  buildValidationMatrixCoverageChartModel,
} from "../../utils/organicAcidStepwiseExecution"

function sourceFixture(overrides = {}) {
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

function activationFixture(workbench) {
  return buildExperimentalActivationWorkbench({
    specificAlMofHosts,
    moIntroductionStrategies,
    minimumExperimentalMatrix,
    sameConditionDataTemplate,
    experimentalValidationResultsTemplate,
    experimentalFeedbackRules,
    activationReadinessSummary,
  }, { topRoute: workbench.complementarity.topRoute })
}

describe("organic acid stepwise execution builders", () => {
  it("builds Step 0-Step 6 with required fields, selected step, why panel, mini map, and dynamic chart models", () => {
    const source = sourceFixture()
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const activationWorkbench = activationFixture(workbench)
    const chain = buildStepwiseExecutionChain(workbench, source, { lang: "zh", activationWorkbench })

    expect(chain.version).toBe("V3.9.10")
    expect(chain.steps.map(step => step.id)).toEqual(["step-0", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6"])
    expect(chain.steps.map(step => step.nameZh)).toEqual([
      "筛选目标设定",
      "反应路径分解",
      "路径与描述符对应关系",
      "主体 MOF 筛选",
      "客体（掺杂金属）筛选",
      "主客体路线评分",
      "实验验证路线输出",
    ])
    expect(chain.selectedStepId).toBe("step-0")
    expect(chain.currentStepWhyPanel.titleZh).toBe("为什么是这个结果？")
    expect(chain.finalResultSummary.finalHGCPS).toBe(workbench.complementarity.topRoute.finalHGCPS)
    expect(chain.finalResultSummary.nextExperiment).toBeTruthy()
    expect(chain.dynamicChartModel.type).toBe("objective-input-output")
    expect(chain.navigator.items.at(-1)).toEqual(expect.objectContaining({ id: "final-result", labelZh: "最终结果", active: false }))
    expect(chain.navigator.runIntervalMs).toBe(900)
    expect(chain.miniMap.nodes.map(node => node.labelZh)).toEqual(["目标", "路径", "描述符", "主体", "客体", "路线", "验证", "结果"])

    for (const step of chain.steps) {
      expect(step.input.length, `${step.id} input`).toBeGreaterThan(0)
      expect(step.logic, `${step.id} logic`).toBeTruthy()
      expect(step.formula, `${step.id} formula`).toBeTruthy()
      expect(step.result, `${step.id} result`).toBeTruthy()
      expect(step.why, `${step.id} why`).toBeTruthy()
      expect(step.next, `${step.id} next`).toBeTruthy()
      expect(step.dynamicChartModel.rows.length, `${step.id} chart rows`).toBeGreaterThan(0)
    }

    const serialized = JSON.stringify(chain)
    expect(serialized).not.toMatch(/undefined|null|NaN/)
    expect(serialized).toMatch(/路线排序仅用于确定实验验证优先级/)
    expect(serialized).toMatch(/未使用训练型预测模型/)
    expect(serialized).toMatch(/算法输出的是实验验证优先级，不是催化性能结论/)
    expect(serialized).not.toMatch(/Cat Playground/)
  })

  it("adds Step 0 prediction / screening target setup without formal ML overclaiming", () => {
    const source = sourceFixture()
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const activationWorkbench = activationFixture(workbench)
    const step0 = buildPredictionObjectiveStep(workbench, source, { lang: "zh", activationWorkbench })
    const chart = buildObjectiveInputOutputChartModel(workbench, source, activationWorkbench, "zh")

    expect(step0.nameZh).toBe("筛选目标设定")
    expect(step0.eyebrowZh).toBe("Screening Objective / 筛选目标")
    expect(step0.result).toMatch(new RegExp(`${workbench.complementarity.topRoute.hostMof} \\+ ${workbench.complementarity.topRoute.guestMetal}`))
    expect(step0.risk).toMatch(/路线排序仅用于确定实验验证优先级/)
    expect(step0.risk).toMatch(/未使用训练型预测模型/)
    expect(chart.rows.find(row => row.id === "host").value).toBe(hostMofCandidates.length)
    expect(chart.rows.find(row => row.id === "guest").value).toBe(guestMetalCandidates.length)
    expect(chart.rows.find(row => row.id === "route").value).toBe(hostGuestRoutes.length)
    expect(chart.outputRoute).toBe(`${workbench.complementarity.topRoute.hostMof} + ${workbench.complementarity.topRoute.guestMetal}`)
  })

  it("derives host, guest, route, pathway, descriptor, and validation chart models from builder inputs", () => {
    const source = sourceFixture()
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const activationWorkbench = activationFixture(workbench)
    const hostChart = buildHostRankingChartModel(workbench, source, "zh")
    const guestChart = buildGuestRankingChartModel(workbench, source, "zh")
    const routeChart = buildRouteHgcpsBreakdownChartModel(workbench, source, "zh")
    const pathwayChart = buildPathwayCoverageChartModel(workbench, source, "zh")
    const descriptorChart = buildStepDynamicChartModel("step-2", workbench, source, activationWorkbench, "zh")
    const validationChart = buildValidationMatrixCoverageChartModel(workbench, source, activationWorkbench, "zh")

    expect(hostChart.rows).toHaveLength(hostMofCandidates.length)
    expect(hostChart.rows[0].host).toBe(workbench.hostSelection.selectedHost.displayName)
    expect(guestChart.rows).toHaveLength(guestMetalCandidates.length)
    expect(guestChart.rows[0].metal).toBe(workbench.guestSelection.selectedGuestMetal.guestMetal)
    expect(routeChart.rows).toHaveLength(hostGuestRoutes.length)
    expect(routeChart.selectedRoute).toBe(`${workbench.complementarity.topRoute.hostMof} + ${workbench.complementarity.topRoute.guestMetal}`)
    expect(routeChart.factorRows.map(row => row.id)).toEqual(["hostStability", "hostPathwaySupport", "guestActivityCompensation", "complementarity", "evidenceConfidence", "riskRetention", "synthesizability", "economics"])
    expect(pathwayChart.rows).toHaveLength(pathwaySteps.length)
    expect(descriptorChart.edges).toHaveLength(pathwayDescriptorMap.length)
    expect(validationChart.experimentCount).toBe(minimumExperimentalMatrix.experimentGroups.length)
    expect(validationChart.rows.some(row => row.id === "carbon" && row.covered)).toBe(true)
  })

  it("lets route chart top output change when route scores change, proving the UI is not hardcoding Al-MOF + Mo", () => {
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
    const source = sourceFixture({ hostGuestRoutes: alteredRoutes })
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const routeChart = buildRouteHgcpsBreakdownChartModel(workbench, source, "zh")

    expect(workbench.complementarity.topRoute.routeId).toBe(alteredRoutes[1].routeId)
    expect(routeChart.rows[0].routeId).toBe(alteredRoutes[1].routeId)
    expect(routeChart.selectedRoute).toBe(`${alteredRoutes[1].hostMof} + ${alteredRoutes[1].guestMetal}`)
    expect(routeChart.selectedRoute).not.toBe(`${hostGuestRoutes[0].hostMof} + ${hostGuestRoutes[0].guestMetal}`)
  })
})
