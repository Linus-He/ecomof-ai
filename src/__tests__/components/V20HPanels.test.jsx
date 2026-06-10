// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { MetadataVerificationQueuePanel } from "../../components/database-index/MetadataVerificationQueuePanel"
import { SensitivityAuditPanel } from "../../components/database-index/SensitivityAuditPanel"
import { FeatureAblationAuditPanel } from "../../components/database-index/FeatureAblationAuditPanel"
import { CandidateValidationRoadmapPanel } from "../../components/database-index/CandidateValidationRoadmapPanel"

const records = Array.from({ length: 16 }, (_, i) => ({
  recordId: `R${i}`,
  displayName: `Candidate ${i}`,
  sourceDatabase: "CoRE MOF",
  sourceRecordId: `COREMOF_${i}`,
  retrievedAt: "2026-06",
  metalNode: i % 2 ? "Cu" : "Al",
  descriptors: { surfaceArea: 600 + i * 50, poreVolume: 0.4 + i * 0.03, voidFraction: 0.3 + i * 0.02, pldA: 5 + (i % 7), lcdA: 9 + (i % 9), bandGap: 2 + (i % 4) * 0.4, openMetalSiteProxy: 0.3 + (i % 5) * 0.1, stabilityProxy: 0.5 + (i % 3) * 0.1, hydrophilicityProxy: 0.5 },
  metadataVerification: { descriptorProvenanceStatus: i % 3 === 0 ? "complete" : "partial" },
}))

function bodyText() {
  return document.body.textContent || ""
}

describe("V2.0-H panels", () => {
  it("renders the Metadata Verification Queue Panel in Chinese without bad claims", () => {
    render(<MetadataVerificationQueuePanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("人工核验队列")).toBeTruthy()
    expect(bodyText()).toMatch(/接近完成核验/)
    expect(bodyText()).not.toMatch(/XGBoost|R²|R\^2|模型准确率/)
  })

  it("renders the Sensitivity Audit Panel in Chinese", () => {
    render(<SensitivityAuditPanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("敏感性审计")).toBeTruthy()
    expect(bodyText()).toMatch(/报告稳定性而非精度|稳定性/)
    expect(bodyText()).not.toMatch(/XGBoost|R²|R\^2|模型准确率/)
  })

  it("renders the Feature Ablation Audit Panel in Chinese", () => {
    render(<FeatureAblationAuditPanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("特征消融审计")).toBeTruthy()
    expect(bodyText()).not.toMatch(/XGBoost|R²|R\^2|模型准确率/)
  })

  it("renders the Candidate Validation Roadmap Panel in Chinese with direction-only language", () => {
    render(<CandidateValidationRoadmapPanel record={records[0]} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("候选验证路线")).toBeTruthy()
    expect(bodyText()).toMatch(/不是最终推荐/)
    expect(bodyText()).not.toMatch(/XGBoost|R²|模型准确率/)
  })
})
