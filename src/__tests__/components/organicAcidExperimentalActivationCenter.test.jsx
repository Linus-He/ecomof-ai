// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import specificAlMofHosts from "../../../public/data/organic_acid_experimental_activation/specific_al_mof_hosts.json"
import moIntroductionStrategies from "../../../public/data/organic_acid_experimental_activation/mo_introduction_strategies.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import experimentalValidationResultsTemplate from "../../../public/data/organic_acid_experimental_activation/experimental_validation_results_template.json"
import experimentalFeedbackRules from "../../../public/data/organic_acid_experimental_activation/experimental_feedback_rules.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import { OrganicAcidExperimentalActivationCenter } from "../../components/catalysis/OrganicAcidExperimentalActivationCenter"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"

function bodyText() {
  return document.body.textContent || ""
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

describe("OrganicAcidExperimentalActivationCenter", () => {
  it("renders readiness, hosts, Mo strategies, matrix, template, feedback, update preview, and exports", () => {
    render(<OrganicAcidExperimentalActivationCenter lang="zh" isNarrow={false} activationWorkbench={activationFixture()} />)
    let text = bodyText()

    expect(screen.getByTestId("organic-acid-experimental-activation-center")).toBeInTheDocument()
    expect(text).toMatch(/有机酸实验启用中心/)
    expect(text).toMatch(/planning-ready \/ not performance-validated/)
    expect(text).toMatch(/可用于实验规划/)
    expect(text).toMatch(/不能用于性能证明/)
    expect(text).toMatch(/不能用于正式机器学习/)
    expect(text).toMatch(/不构成最终催化性能证明/)
    expect(text).toMatch(/尚不具备正式机器学习条件/)
    expect(text).toMatch(/route-al-mof-mo/)
    expect(text).toMatch(/Al-MOF \+ Mo/)
    expect(text).toMatch(/主体材料候选/)
    expect(text).toMatch(/MIL-53\\(Al\\)-like|MIL-53/)
    expect(text).toMatch(/Primary stable host candidate/)

    fireEvent.click(screen.getByRole("tab", { name: "Mo 引入方案" }))
    text = bodyText()
    expect(text).toMatch(/Mo 引入方案/)
    expect(text).toMatch(/low synthesis risk \/ first activation/)
    expect(text).toMatch(/Mo post-synthetic modification/)
    expect(text).toMatch(/pore confinement \/ impregnation/)

    fireEvent.click(screen.getByRole("tab", { name: "实验矩阵" }))
    text = bodyText()
    expect(text).toMatch(/最小实验矩阵/)
    expect(text).toMatch(/Blank control/)
    expect(text).toMatch(/Pristine Al-MOF/)
    expect(text).toMatch(/Zr-MOF/)
    expect(text).toMatch(/MoOx/)

    fireEvent.click(screen.getByRole("tab", { name: "数据模板" }))
    text = bodyText()
    expect(text).toMatch(/同条件数据记录模板/)
    expect(text).toMatch(/Experiment ID/)
    expect(text).toMatch(/Affects:/)

    fireEvent.click(screen.getByRole("tab", { name: "回填规则" }))
    text = bodyText()
    expect(text).toMatch(/实验结果回填与算法更新/)
    expect(text).toMatch(/has real results: false/)
    expect(text).toMatch(/same-condition result/)

    fireEvent.click(screen.getByRole("tab", { name: "更新预览" }))
    text = bodyText()
    expect(text).toMatch(/算法更新预览/)
    expect(text).toMatch(/Supported result/)
    expect(text).toMatch(/Contradicted result/)
    expect(text).toMatch(/Inconclusive result/)
    expect(text).toMatch(/No formal reranking or machine learning update/)

    fireEvent.click(screen.getByRole("tab", { name: "导出" }))
    text = bodyText()
    expect(text).toMatch(/Specific Al-MOF Hosts CSV/)
    expect(text).toMatch(/Mo Introduction Strategies CSV/)
    expect(text).toMatch(/Minimum Experimental Matrix CSV/)
    expect(text).toMatch(/Same-Condition JSON Schema/)
    expect(text).toMatch(/Experimental Feedback Rules JSON/)
    expect(text).toMatch(/Activation Readiness JSON/)
    expect(text).toMatch(/Experimental Activation Report Markdown/)
    expect(text).not.toMatch(/undefined|null|NaN|Cat Playground/)
  })
})
