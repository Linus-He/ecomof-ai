// @ts-nocheck
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
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
import fairMofsFamilyEvidence from "../../../public/data/fair_mofs_family_synthesis_evidence.json"
import specificAlMofHosts from "../../../public/data/organic_acid_experimental_activation/specific_al_mof_hosts.json"
import moIntroductionStrategies from "../../../public/data/organic_acid_experimental_activation/mo_introduction_strategies.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import experimentalValidationResultsTemplate from "../../../public/data/organic_acid_experimental_activation/experimental_validation_results_template.json"
import experimentalFeedbackRules from "../../../public/data/organic_acid_experimental_activation/experimental_feedback_rules.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import { OrganicAcidHostGuestWorkbench } from "../../components/catalysis/OrganicAcidHostGuestWorkbench"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"

function sourceFixture() {
  return {
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
    fairMofsFamilyEvidence,
  }
}

function workbenchFixture() {
  return buildOrganicAcidHostGuestWorkbench(sourceFixture())
}

function activationFixture(workbench = workbenchFixture()) {
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

function bodyText() {
  return document.body.textContent || ""
}

function renderWorkbench() {
  const workbench = workbenchFixture()
  return render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} initialData={sourceFixture()} workbench={workbench} activationWorkbench={activationFixture(workbench)} />)
}

describe("OrganicAcidHostGuestWorkbench", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the V3.9.10 stepwise execution chain from Step 0 before any route-output emphasis", () => {
    renderWorkbench()
    const text = bodyText()

    expect(screen.getByTestId("organic-acid-host-guest-workbench")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-stepwise-execution-chain")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-navigator")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-mini-map")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-why-panel")).toBeInTheDocument()

    expect(text).toMatch(/EcoMOF-AI V3\.9\.10/)
    expect(text).toMatch(/合成条件可及性，不是合成成功率/)
    expect(text).toMatch(/筛选目标设定/)
    expect(text).toMatch(/Screening Objective \/ 筛选目标/)
    expect(text).toMatch(/有机酸分步算法执行链/)
    for (const label of ["Step 0", "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"]) {
      expect(text).toMatch(new RegExp(label))
    }
    expect(text).toMatch(/最终结果/)
    expect(text).toMatch(/Final Result/)
    expect(text).toMatch(/反应路径分解/)
    expect(text).toMatch(/路径与描述符对应关系/)
    expect(text).toMatch(/主体 MOF 筛选/)
    expect(text).toMatch(/客体（掺杂金属）筛选/)
    expect(text).toMatch(/主客体路线评分/)
    expect(text).toMatch(/实验验证路线输出/)
    expect(text).toMatch(/为什么是这个结果？/)
    expect(text).toMatch(/算法输出的是实验验证优先级，不是催化性能结论/)
    expect(text).toMatch(/路线排序仅用于确定实验验证优先级/)
    expect(text).toMatch(/未使用训练型预测模型/)
    expect(text).toMatch(/实验规划可启用/)
    expect(text).toMatch(/同条件性能验证尚未完成/)
    expect(text).toMatch(/实际计算结构/)
    expect(text).toMatch(/假设路线，无对应 3D 晶体结构/)
    expect(screen.getAllByRole("button", { name: "查看主体 3D" }).length).toBeGreaterThan(0)
    expect(text.indexOf("筛选目标设定")).toBeLessThan(text.indexOf("最终结果总结"))
    expect(text).not.toMatch(/Current algorithm recommendation:/)
    expect(text).not.toMatch(/Cat Playground/)
    expect(text).not.toMatch(/undefined|null|NaN/)
    expect(screen.queryByTestId("organic-acid-algorithm-flow-network")).not.toBeInTheDocument()
    expect(screen.queryByTestId("organic-acid-node-inspector")).not.toBeInTheDocument()
    expect(screen.queryByTestId("organic-acid-candidate-competition")).not.toBeInTheDocument()

    expect(document.getElementById("organic-acid-experimental-activation-entry")?.open).toBe(false)
    expect(document.getElementById("organic-acid-advanced-robustness-evidence")?.open).toBe(false)
  })

  it("renders dynamic charts for objective, pathway, descriptor, host, guest, route, and validation steps", () => {
    renderWorkbench()

    expect(screen.getByTestId("objective-input-output-chart")).toBeInTheDocument()
    expect(screen.getByTestId("pathway-coverage-chart")).toHaveAttribute("data-row-count", String(pathwaySteps.length))
    expect(screen.getByTestId("descriptor-mapping-graph")).toHaveAttribute("data-row-count", String(pathwayDescriptorMap.length))
    expect(screen.getByTestId("host-ranking-chart")).toHaveAttribute("data-row-count", String(hostMofCandidates.length))
    expect(screen.getByTestId("guest-ranking-chart")).toHaveAttribute("data-row-count", String(guestMetalCandidates.length))
    expect(screen.getByTestId("route-hgcps-breakdown-chart")).toHaveAttribute("data-row-count", String(hostGuestRoutes.length))
    expect(screen.getByTestId("validation-matrix-coverage-chart")).toBeInTheDocument()

    const text = bodyText()
    expect(text).toMatch(/目标输入输出图/)
    expect(text).toMatch(/路径步骤覆盖图/)
    expect(text).toMatch(/路径—描述符映射图/)
    expect(text).toMatch(/主体候选排名图/)
    expect(text).toMatch(/客体金属排名图/)
    expect(text).toMatch(/路线评分分解图/)
    expect(text).toMatch(/验证矩阵覆盖图/)
  })

  it("syncs the Step Why Panel score explainer with the Step Navigator", () => {
    renderWorkbench()

    const navigator = screen.getByTestId("organic-acid-step-navigator")
    const guestStepButton = within(navigator).getAllByRole("button").find(button => button.textContent?.includes("Step 4") && button.textContent?.includes("客体"))
    expect(guestStepButton).toBeTruthy()
    fireEvent.click(guestStepButton)

    // Step 4 main chart is the guest dumbbell explainer with a score source table in the evidence tab.
    const whyPanel = screen.getByTestId("organic-acid-step-why-panel")
    expect(within(whyPanel).getByTestId("guest-dumbbell-chart")).toBeInTheDocument()
    expect(within(whyPanel).getByTestId("score-source-table")).toBeInTheDocument()
    expect(whyPanel.textContent).toMatch(/这个分数怎么算出来的？/)
    expect(whyPanel.textContent).toMatch(/为什么不是其他候选/)

    // Step 5 shows the HGCPS factor compression waterfall on the first screen.
    const routeStepButton = within(navigator).getAllByRole("button").find(button => button.textContent?.includes("Step 5"))
    fireEvent.click(routeStepButton)
    const routeWhyPanel = screen.getByTestId("organic-acid-step-why-panel")
    for (const label of ["结论", "逐因子", "对比路线", "证据 / 文献", "风险 / 反事实"]) {
      expect(within(routeWhyPanel).getByRole("tab", { name: label })).toBeInTheDocument()
    }
    expect(within(routeWhyPanel).getByRole("tab", { name: "结论" })).toHaveAttribute("aria-selected", "true")
    expect(within(routeWhyPanel).getByTestId("hgcps-factor-rose")).toHaveAttribute("data-row-count", "8")
    expect(within(routeWhyPanel).getByTestId("factor-compression-waterfall")).toBeInTheDocument()
    expect(within(routeWhyPanel).getByTestId("route-factor-comparison-chart")).toBeInTheDocument()
    expect(within(routeWhyPanel).getByTestId("score-source-table")).toBeInTheDocument()
    // Step 5 surfaces the HGCPS / OACS / DMRS terminology crosswalk.
    expect(within(routeWhyPanel).getByTestId("terminology-crosswalk")).toBeInTheDocument()
    expect(routeWhyPanel.textContent).toMatch(/HGCPS \/ OACS \/ DMRS/)
  })

  it("runs the stepwise chain through Step 0-Step 6 and stops at the final result item", () => {
    vi.useFakeTimers()
    renderWorkbench()
    const navigator = screen.getByTestId("organic-acid-step-navigator")
    const runButton = within(navigator).getByTestId("organic-acid-run-control")

    fireEvent.click(runButton)
    expect(within(navigator).getByText("停止")).toBeInTheDocument()
    expect(within(navigator).getByRole("button", { name: /Step 0/ })).toHaveAttribute("data-selected", "true")

    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(within(navigator).getByRole("button", { name: /Step 1/ })).toHaveAttribute("data-selected", "true")

    act(() => {
      vi.advanceTimersByTime(900 * 6)
    })
    expect(within(navigator).getByRole("button", { name: /Final/ })).toHaveAttribute("data-selected", "true")
    expect(within(navigator).getByText("运行算法")).toBeInTheDocument()
  })

  it("inlines the Step Why Panel directly under the selected step on narrow screens", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow initialData={sourceFixture()} workbench={workbenchFixture()} activationWorkbench={activationFixture()} />)
    const panels = screen.getAllByTestId("organic-acid-step-why-panel")
    expect(panels).toHaveLength(1)
    const selectedCard = screen.getByTestId("organic-acid-execution-step-0")
    expect(selectedCard.nextElementSibling).toBe(panels[0])
  })

  function gotoStep(label) {
    const navigator = screen.getByTestId("organic-acid-step-navigator")
    const button = within(navigator).getAllByRole("button").find(b => b.textContent?.includes(label))
    expect(button).toBeTruthy()
    fireEvent.click(button)
    return screen.getByTestId("organic-acid-step-why-panel")
  }

  it("completes the Step 1 / Step 2 / Step 6 explanation closure", () => {
    renderWorkbench()

    const step1 = gotoStep("Step 1")
    expect(within(step1).getByTestId("pathway-evidence-heatmap")).toBeInTheDocument()
    expect(step1.textContent).toMatch(/CO₂→有机酸路径被分解为 \d+ 个步骤/)

    const step2 = gotoStep("Step 2")
    expect(within(step2).getByTestId("descriptor-mapping-explanation")).toBeInTheDocument()
    expect(step2.textContent).toMatch(/个路径步骤映射到 \d+ 个描述符组/)
    expect(step2.textContent).toMatch(/缺 \d+ 项描述符/)

    const step6 = gotoStep("Step 6")
    expect(within(step6).getByTestId("validation-coverage-matrix")).toBeInTheDocument()
    expect(step6.textContent).toMatch(/不代表实验已完成/)
    expect(step6.textContent).toMatch(/打开实验启用中心/)
    expect(step6.textContent).toMatch(/下载同条件数据模板/)

    expect(bodyText()).not.toMatch(/undefined|null|NaN/)
    expect(bodyText()).not.toMatch(/Cat Playground/)
  })

  it("keeps candidate competition embedded in Steps 3-5 and opens folded advanced or activation sections from step controls", () => {
    renderWorkbench()
    const text = bodyText()

    const workbench = workbenchFixture()
    expect(text).toMatch(new RegExp(`${workbench.hostSelection.selectedHost.displayName} · 主体得分`))
    expect(text).toMatch(new RegExp(`#1${workbench.hostSelection.selectedHost.displayName}`))
    expect(text).toMatch(new RegExp(`${workbench.guestSelection.selectedGuestMetal.guestMetal} 在客体竞争中胜出`))
    expect(text).toMatch(new RegExp(`#1${workbench.guestSelection.selectedGuestMetal.guestMetal}`))
    expect(text).toMatch(new RegExp(`${workbench.complementarity.topRoute.hostMof} \\+ ${workbench.complementarity.topRoute.guestMetal} .*HGCPS`))
    const hostOnlyControl = workbench.complementarity.routeScores.find(route => /host-only|pristine/i.test(`${route.routeType} ${route.guestMetal}`))
    expect(text).toMatch(new RegExp(`${hostOnlyControl.hostMof} \\+ ${hostOnlyControl.guestMetal} 是 host-only control`))
    expect(text).toMatch(/最终结果总结/)
    expect(text).toMatch(/HGCPS 因子贡献谱|HGCPS 八因子贡献谱/)

    fireEvent.click(screen.getAllByRole("button", { name: /打开高级分析/ })[0])
    expect(document.getElementById("organic-acid-advanced-robustness-evidence")?.open).toBe(true)

    fireEvent.click(screen.getAllByRole("button", { name: /打开实验启用中心/ })[0])
    expect(document.getElementById("organic-acid-experimental-activation-entry")?.open).toBe(true)
    expect(bodyText()).toMatch(/现在可以用于实验规划，但还不能用于性能证明/)
    expect(bodyText()).toMatch(/本区用途：/)
  })
})
