// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
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
  }
}

function workbenchFixture() {
  return buildOrganicAcidHostGuestWorkbench(sourceFixture())
}

function activationFixture() {
  return buildExperimentalActivationWorkbench({
    specificAlMofHosts,
    moIntroductionStrategies,
    minimumExperimentalMatrix,
    sameConditionDataTemplate,
    experimentalValidationResultsTemplate,
    experimentalFeedbackRules,
    activationReadinessSummary,
  }, { topRoute: hostGuestRoutes[0] })
}

function bodyText() {
  return document.body.textContent || ""
}

function renderWorkbench() {
  return render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} initialData={sourceFixture()} workbench={workbenchFixture()} activationWorkbench={activationFixture()} />)
}

describe("OrganicAcidHostGuestWorkbench", () => {
  it("renders the V3.9.5.1 stepwise execution chain from Step 0 before any route-output emphasis", () => {
    renderWorkbench()
    const text = bodyText()

    expect(screen.getByTestId("organic-acid-host-guest-workbench")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-stepwise-execution-chain")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-navigator")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-mini-map")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-step-why-panel")).toBeInTheDocument()

    expect(text).toMatch(/EcoMOF-AI V3\.9\.5\.1/)
    expect(text).toMatch(/筛选目标设定/)
    expect(text).toMatch(/Prediction Objective \/ Screening Target/)
    expect(text).toMatch(/有机酸分步算法执行链/)
    for (const label of ["Step 0", "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"]) {
      expect(text).toMatch(new RegExp(label))
    }
    expect(text).toMatch(/路径步骤识别/)
    expect(text).toMatch(/路径步骤—描述符映射/)
    expect(text).toMatch(/主体 MOF 筛选/)
    expect(text).toMatch(/客体 \/ 掺杂金属筛选/)
    expect(text).toMatch(/主客体路线评分/)
    expect(text).toMatch(/实验验证输出/)
    expect(text).toMatch(/为什么是这个结果？/)
    expect(text).toMatch(/该解释由当前数据与 builder 输出生成，不是静态文案/)
    expect(text).toMatch(/非最终催化性能证明/)
    expect(text).toMatch(/非正式机器学习推荐/)
    expect(text).toMatch(/实验规划可启用/)
    expect(text).toMatch(/尚未完成性能验证/)
    expect(text.indexOf("筛选目标设定")).toBeLessThan(text.indexOf("Al-MOF + Mo 是当前最高优先级验证路线"))
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

  it("syncs the Step Why Panel with Step Navigator and clicked chart candidates", () => {
    renderWorkbench()

    const navigator = screen.getByTestId("organic-acid-step-navigator")
    const guestStepButton = within(navigator).getAllByRole("button").find(button => button.textContent?.includes("Step 4") && button.textContent?.includes("客体"))
    expect(guestStepButton).toBeTruthy()
    fireEvent.click(guestStepButton)

    const whyPanel = screen.getByTestId("organic-acid-step-why-panel")
    expect(whyPanel.textContent).toMatch(/客体 \/ 掺杂金属筛选/)
    expect(whyPanel.textContent).toMatch(/Mo 同时支持 CO₂ 活化、HCOO\* 稳定和 PCET/)

    const guestChart = screen.getByTestId("guest-ranking-chart")
    const wButton = within(guestChart).getAllByRole("button").find(button => button.textContent?.includes("W"))
    expect(wButton).toBeTruthy()
    fireEvent.click(wButton)
    expect(screen.getByTestId("organic-acid-step-why-panel").textContent).toMatch(/W 是 oxo-metal backup/)
  })

  it("keeps candidate competition embedded in Steps 3-5 and opens folded advanced or activation sections from step controls", () => {
    renderWorkbench()
    const text = bodyText()

    expect(text).toMatch(/Al-MOF 在主体竞争中胜出/)
    expect(text).toMatch(/Zr-MOF 保留为 backup \/ control/)
    expect(text).toMatch(/Mo 在客体竞争中胜出/)
    expect(text).toMatch(/W 是 oxo-metal backup/)
    expect(text).toMatch(/Al-MOF \+ Mo 在 route competition 中排第一/)
    expect(text).toMatch(/Al-MOF \+ none \/ pristine 是 host-only control/)
    expect(text).toMatch(/HGCPS = Host Stability Factor/)

    fireEvent.click(screen.getAllByRole("button", { name: /打开高级分析/ })[0])
    expect(document.getElementById("organic-acid-advanced-robustness-evidence")?.open).toBe(true)

    fireEvent.click(screen.getAllByRole("button", { name: /打开实验启用中心/ })[0])
    expect(document.getElementById("organic-acid-experimental-activation-entry")?.open).toBe(true)
    expect(bodyText()).toMatch(/现在可以用于实验规划，但还不能用于性能证明/)
    expect(bodyText()).toMatch(/这个 tab 解决什么问题？/)
  })
})
