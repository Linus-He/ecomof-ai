// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DescriptorRedundancyPanel } from "../../components/database-index/DescriptorRedundancyPanel"
import { MechanismProxyPanel } from "../../components/database-index/MechanismProxyPanel"
import { AlgorithmImprovementTracePanel } from "../../components/database-index/AlgorithmImprovementTracePanel"

const records = Array.from({ length: 10 }, (_, i) => ({
  recordId: `R${i}`,
  sourceDatabase: "CoRE MOF",
  metalNode: "Cu",
  descriptors: { surfaceArea: 800 + i * 30, poreSizeA: 6 + i, pldA: 6 + i, poreVolume: 0.5 + i * 0.02, density: 1.1, bandGap: 2.4, openMetalSiteProxy: 0.6, stabilityProxy: 0.7, hydrophilicityProxy: 0.5, lcdA: 10 + i },
  metadataVerification: { verificationLevel: "partial_metadata" },
  descriptorProvenance: { source: "database" },
  notFinalRecommendation: true,
}))

function bodyText() {
  return document.body.textContent || ""
}

describe("V2.0-G panels", () => {
  it("renders the Descriptor Redundancy Panel with Chinese labels and no bad claims", () => {
    render(<DescriptorRedundancyPanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("描述符冗余门控")).toBeTruthy()
    expect(bodyText()).toMatch(/不会自动删除字段/)
    expect(bodyText()).not.toMatch(/XGBoost|R²|R\^2|最终推荐/)
  })

  it("renders the Mechanism Proxy Panel with Chinese labels and a hypothesis boundary", () => {
    render(<MechanismProxyPanel record={records[0]} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("机制代理指标")).toBeTruthy()
    expect(screen.getByText("CO₂ 活化代理")).toBeTruthy()
    expect(bodyText()).toMatch(/不是 DFT 或实验结论/)
    expect(bodyText()).not.toMatch(/XGBoost|已训练|R²/)
  })

  it("renders the Algorithm Improvement Trace Panel without model-accuracy claims", () => {
    render(<AlgorithmImprovementTracePanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("算法改进追踪")).toBeTruthy()
    expect(bodyText()).toMatch(/不代表已经训练预测模型/)
    expect(bodyText()).not.toMatch(/XGBoost|R²|R\^2|MAE|RMSE/)
  })
})
