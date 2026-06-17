// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidFinalDecisionBoard } from "../../components/catalysis/organic-acid-final/OrganicAcidFinalDecisionBoard"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"

describe("organicAcidDecisionTraceAlgorithm", () => {
  it("renders the real 10-step algorithm trace from ranked output", () => {
    const algorithm = rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" })
    render(<OrganicAcidFinalDecisionBoard result={{ organicAcidAlgorithm: algorithm }} lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("organic-acid-decision-trace")).toBeInTheDocument()
    for (const label of ["候选加载", "特征可用性检查", "路径适配计算", "证据修正", "图论相关性计算", "结构适配计算", "风险惩罚应用", "验证就绪度检查", "最终排序", "下一步实验生成"]) {
      expect(document.body.textContent).toMatch(new RegExp(label))
    }
    expect(document.body.textContent).toMatch(/影响分数/)
    expect(document.body.textContent).toMatch(/阻断因素/)
    expect(document.body.textContent).toMatch(/解释/)
  })
})
