// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidFinalDecisionBoard } from "../../components/catalysis/organic-acid-final/OrganicAcidFinalDecisionBoard"

const result = {
  moRecommendation: { metal: "Mo" },
  rankedFrameworks: [
    {
      id: "mil-53",
      rank: 1,
      displayName: "MIL-53(Al)",
      sourceDatabase: "curated",
      sourceRecordId: "C1",
      hydrothermalGate: { status: "pass" },
      organicAcidScore: { oacs: 0.86, evidenceLevel: "top_recommendation_eligible", collapseRisk: 0.2 },
      descriptorScores: { poreAccessibility: 0.78 },
    },
  ],
}

describe("organicAcidFinalDecisionBoard", () => {
  it("renders unified candidate decision fields and actions", () => {
    render(<OrganicAcidFinalDecisionBoard result={result} lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("organic-acid-final-decision-board")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/有机酸最终决策面板/)
    expect(document.body.textContent).toMatch(/candidateName/)
    expect(document.body.textContent).toMatch(/targetProduct/)
    expect(document.body.textContent).toMatch(/pathwayRole/)
    expect(document.body.textContent).toMatch(/finalScore/)
    expect(document.body.textContent).toMatch(/查看路径依据/)
    expect(document.body.textContent).toMatch(/查看证据来源/)
    expect(document.body.textContent).toMatch(/查看图论指标/)
    expect(document.body.textContent).toMatch(/查看实验建议/)
  })
})
