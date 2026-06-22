// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
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

describe("OrganicAcidHostGuestWorkbench", () => {
  it("renders the V3.9.5 flow-network IA before route output and keeps advanced areas folded", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} initialData={sourceFixture()} workbench={workbenchFixture()} activationWorkbench={activationFixture()} />)
    const text = bodyText()

    expect(screen.getByTestId("organic-acid-host-guest-workbench")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-algorithm-status-bar")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-algorithm-flow-network")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-node-inspector")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-candidate-competition")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-route-output")).toBeInTheDocument()

    expect(text).toMatch(/EcoMOF-AI V3\.9\.5/)
    expect(text).toMatch(/当前阶段：实验规划可启用/)
    expect(text).toMatch(/10 个主体候选 \/ 12 个客体金属 \/ 25 条路线 \/ 58 条证据风险记录/)
    expect(text).toMatch(/有机酸算法链式网络/)
    expect(text).toMatch(/节点解释器/)
    expect(text).toMatch(/候选竞争/)
    expect(text).toMatch(/路线输出/)
    expect(text).toMatch(/Al-MOF \+ Mo 最高优先级验证路线/)
    expect(text).toMatch(/非最终催化性能证明/)
    expect(text).toMatch(/非正式机器学习推荐/)
    expect(text).toMatch(/Algorithm Flow Network JSON/)
    expect(text).toMatch(/Node Inspector Summary JSON/)
    expect(text).toMatch(/Candidate Competition CSV/)
    expect(text).toMatch(/Route Competition CSV/)
    expect(text).toMatch(/Algorithm Flow Markdown Summary/)

    expect(text.indexOf("Algorithm Flow Network")).toBeLessThan(text.indexOf("Route Output"))
    expect(text).not.toMatch(/Current algorithm recommendation:/)
    expect(text).not.toMatch(/Al-MOF is final best catalyst/i)
    expect(text).not.toMatch(/Mo-MOF is optimal/i)
    expect(text).not.toMatch(/machine learning predicted/i)
    expect(text).not.toMatch(/already proved/i)
    expect(text).not.toMatch(/Cat Playground/)
    expect(text).not.toMatch(/undefined|null|NaN/)

    expect(document.getElementById("organic-acid-experimental-activation-entry")?.open).toBe(false)
    expect(document.getElementById("organic-acid-advanced-robustness-evidence")?.open).toBe(false)
  })

  it("updates the node inspector from pathway to Mo and opens linked folded sections", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} initialData={sourceFixture()} workbench={workbenchFixture()} activationWorkbench={activationFixture()} />)

    expect(bodyText()).toMatch(/作为 CO2 -> 有机酸链条的反应瓶颈起点/)

    const moNodeButton = screen.getAllByRole("button").find(button => (
      button.textContent?.includes("Mo") && button.textContent?.includes("客体竞争胜出")
    ))
    expect(moNodeButton).toBeTruthy()
    fireEvent.click(moNodeButton)

    expect(bodyText()).toMatch(/Mo 支持 CO2 activation \/ HCOO\* \/ PCET/)
    expect(bodyText()).toMatch(/客体 \/ 掺杂 \/ 活性补偿金属/)
    expect(bodyText()).toMatch(/Mo introduction feasibility and local coordination state remain uncertain/)

    fireEvent.click(screen.getByRole("button", { name: /缺失证据与风险矩阵/ }))
    expect(document.getElementById("organic-acid-advanced-robustness-evidence")?.open).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: /查看实验启用中心/ }))
    expect(document.getElementById("organic-acid-experimental-activation-entry")?.open).toBe(true)
    expect(bodyText()).toMatch(/现在可以用于实验规划，但还不能用于性能证明/)
    expect(bodyText()).toMatch(/这个 tab 解决什么问题？/)
  })

  it("renders host, guest, and route competition explanations without overclaiming", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} initialData={sourceFixture()} workbench={workbenchFixture()} activationWorkbench={activationFixture()} />)
    const text = bodyText()

    expect(text).toMatch(/Host Competition \/ 主体 MOF 竞争/)
    expect(text).toMatch(/Al-MOF 在主体竞争中胜出/)
    expect(text).toMatch(/Zr-MOF 保留为 backup \/ control/)
    expect(text).toMatch(/Ti-MOF 保留为 control \/ conditional/)
    expect(text).toMatch(/Fe-MOF 保留为 control \/ conditional/)
    expect(text).toMatch(/Cu-MOF 保留为 control \/ conditional/)

    expect(text).toMatch(/Guest Competition \/ 客体金属竞争/)
    expect(text).toMatch(/Mo 在客体竞争中胜出/)
    expect(text).toMatch(/W 是 oxo-metal backup/)
    expect(text).toMatch(/Fe 是 control \/ conditional redox guest/)
    expect(text).toMatch(/Co 是 control \/ conditional redox guest/)
    expect(text).toMatch(/Ni 是 control \/ conditional redox guest/)

    expect(text).toMatch(/Route Competition \/ 路线竞争/)
    expect(text).toMatch(/Al-MOF \+ Mo 在 route competition 中排第一/)
    expect(text).toMatch(/Al-MOF \+ none \/ pristine 是 host-only control/)
    expect(text).toMatch(/Zr-MOF \+ Mo 是 host-framework control/)
    expect(text).toMatch(/Al-MOF \+ W 是 conditional route/)
  })
})
