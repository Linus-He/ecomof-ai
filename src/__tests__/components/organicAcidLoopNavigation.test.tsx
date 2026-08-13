// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { OrganicAcidProject } from "../../components/catalysis/OrganicAcidProject"
import { OrganicAcidResearchValidationCenter } from "../../components/catalysis/researchValidation/OrganicAcidResearchValidationCenter"

const result = {
  rankedFrameworks: [
    { id: "OA-NAV-1", displayName: "Navigation Candidate", rank: 1, hydrothermalGate: { status: "pass" }, organicAcidScore: { oacs: 0.82 } },
  ],
}

const evidenceRecords = [
  { id: "NAV-EV-1", claim: "Navigation evidence.", evidenceType: "literature_proxy", targetDescriptor: "activity" },
]

const labels = {
  labels: [
    { labelId: "NAV-LB-1", experimentId: "NAV-EXP-1", candidateId: "OA-NAV-1", sourceType: "independent_validation", sourceCitation: "Navigation label" },
  ],
}

function response(data) {
  return { ok: true, json: async () => data }
}

beforeEach(() => {
  window.sessionStorage.setItem("ecomof_organic_acid_project_access", "granted")
  vi.stubGlobal("fetch", vi.fn(async url => {
    const text = String(url)
    if (text.includes("organic_acid_project_demo.json")) return response([])
    if (text.includes("organic_acid_reaction_rules.json")) return response([])
    if (text.includes("organic_acid_evidence_items.json")) return response([])
    return response([])
  }))
})

afterEach(() => {
  window.sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe("Organic Acid validation loop navigation", () => {
  it("explains why the research workspace is temporarily limited", () => {
    window.sessionStorage.removeItem("ecomof_organic_acid_project_access")
    render(<OrganicAcidProject lang="zh" t={THEME_LIGHT} />)

    const notice = screen.getByLabelText("访问范围说明")
    expect(notice).toHaveTextContent("很抱歉，当前工作区暂未向所有访客开放")
    expect(notice).toHaveTextContent("尚未公开的研究记录、合作信息")
    expect(notice).toHaveTextContent("仅向获授权的研究参与者提供访问")
    expect(notice).toHaveTextContent("催化总览仍会持续公开不含受限内容的研究进展")
  })

  it("keeps the existing Organic Acid Project accessible and adds validation-center entries", async () => {
    render(<OrganicAcidProject lang="zh" t={THEME_LIGHT} />)

    await waitFor(() => expect(screen.getByText("有机酸研究验证入口")).toBeInTheDocument())

    expect(screen.getByText("进入研究验证中心").closest("a")).toHaveAttribute("href", "#organic-acid-research-validation")
    expect(screen.getByText("查看证据覆盖").closest("a")).toHaveAttribute("href", "#organic-acid-evidence-coverage")
    expect(screen.getByText("查看置信度矩阵").closest("a")).toHaveAttribute("href", "#organic-acid-confidence-matrix")
    expect(screen.getByText("查看候选优先队列").closest("a")).toHaveAttribute("href", "#organic-acid-priority-queue")
    expect(screen.getByText("查看知识图谱").closest("a")).toHaveAttribute("href", "#organic-acid-knowledge-graph")
    expect(document.body.textContent).toMatch(/Organic Acid Carbon-Flow Graph Workbench|有机酸碳流图论路径工作台/)
    expect(document.body.textContent).toMatch(/Algorithm Trace Explorer|算法追踪器/)
    expect(document.body.textContent).toMatch(/Candidate Prioritization Workspace|候选物优先级/)
  })

  it("adds return entries from Research Validation Center back to legacy workbench modules", () => {
    render(<OrganicAcidResearchValidationCenter result={result} evidenceRecords={evidenceRecords} experimentalLabels={labels} benchmarkDataset={{ records: [] }} lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByText("返回三路径网络").closest("a")).toHaveAttribute("href", "#organic-acid-workbench")
    expect(screen.getByText("返回算法追踪器").closest("a")).toHaveAttribute("href", "#algorithm-trace-explorer")
    expect(screen.getByText("返回候选排序工作台").closest("a")).toHaveAttribute("href", "#priority")
    expect(screen.getByText("返回图论工作台").closest("a")).toHaveAttribute("href", "#organic-acid-carbon-flow-graph")
  })
})
