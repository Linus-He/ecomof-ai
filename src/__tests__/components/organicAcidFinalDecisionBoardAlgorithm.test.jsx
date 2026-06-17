// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidFinalDecisionBoard } from "../../components/catalysis/organic-acid-final/OrganicAcidFinalDecisionBoard"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"

describe("organicAcidFinalDecisionBoardAlgorithm", () => {
  it("reads score breakdown, recommendation class, risks, and data gaps from algorithm output", () => {
    const algorithm = rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" })
    render(<OrganicAcidFinalDecisionBoard result={{ organicAcidAlgorithm: algorithm }} lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("organic-acid-final-decision-board")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-score-breakdown")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/算法合理性检查/)
    expect(document.body.textContent).toMatch(/敏感性分析/)
    expect(document.body.textContent).toMatch(/recommendationClass/)
    expect(document.body.textContent).toMatch(/riskPenalty/)
    expect(document.body.textContent).toMatch(/为什么排在这里/)
    expect(document.body.textContent).toMatch(/哪些风险拉低评分/)
  })
})
