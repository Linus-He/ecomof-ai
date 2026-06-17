// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidFinalDecisionBoard } from "../../components/catalysis/organic-acid-final/OrganicAcidFinalDecisionBoard"

describe("organicAcidDecisionTrace", () => {
  it("shows every required decision trace step with input output impact blockers and next action", () => {
    render(<OrganicAcidFinalDecisionBoard result={{
      rankedFrameworks: [{
        id: "a",
        rank: 1,
        displayName: "A",
        sourceDatabase: "curated",
        sourceRecordId: "R1",
        hydrothermalGate: { status: "needs_review" },
        organicAcidScore: { oacs: 0, evidenceLevel: "needs_review", collapseRisk: 0.5 },
        descriptorScores: { poreAccessibility: 0.4 },
      }],
      rankedMetals: [{ metal: "Mo" }],
    }} lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("organic-acid-decision-trace")).toBeInTheDocument()
    for (const label of ["原始候选", "路径映射", "图论指标计算", "证据修正", "优先级评分", "风险检查", "最终候选"]) {
      expect(document.body.textContent).toMatch(new RegExp(label))
    }
    expect(document.body.textContent).toMatch(/输入/)
    expect(document.body.textContent).toMatch(/输出/)
    expect(document.body.textContent).toMatch(/影响指标/)
    expect(document.body.textContent).toMatch(/阻断因素/)
    expect(document.body.textContent).toMatch(/下一步建议/)
  })
})
