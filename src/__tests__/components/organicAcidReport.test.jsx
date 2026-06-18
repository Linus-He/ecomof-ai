// @ts-nocheck
import { describe, expect, it } from "vitest"
import { generateResearchReport } from "../../utils/researchReports"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"

describe("organicAcidReport", () => {
  it("generates a natural-language Organic Acid Screening Report", () => {
    const organicAcidAlgorithm = rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" })
    const report = generateResearchReport({
      type: "organic_acid",
      organicAcidResult: { organicAcidAlgorithm },
      versionData: { currentVersion: "V2.6" },
      timestamp: "2026-06-17T00:00:00.000Z",
    })

    expect(report.title).toBe("有机酸筛选报告")
    expect(report.executiveSummary).toMatch(/Organic Acid Screening Report/)
    expect(report.executiveSummary).toMatch(/算法建议，仍需实验验证/)
    expect(report.executiveSummary).toMatch(/Accuracy \/ ROC-AUC 均为 Pending/)
    expect(report.sections.map(section => section.title)).toEqual(expect.arrayContaining([
      "研究目标",
      "评分模式",
      "Model Benchmark Readiness",
      "Feature Importance Summary",
      "Top Candidate Review",
      "Candidate Stability",
      "Score breakdown",
      "Decision trace",
      "Sanity check",
      "Sensitivity analysis",
      "Benchmark Roadmap",
      "Known limitations",
    ]))
    expect(report.sections.find(section => section.title === "Model Benchmark Readiness").body).toMatch(/Experimental labels required/)
    expect(report.markdown).toMatch(/white-box MCDA|白盒/)
  })
})
