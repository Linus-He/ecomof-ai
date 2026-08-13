// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import recordDataset from "../../../public/data/catalysis_reaction_records_v1.json"
import verificationDatabase from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import verificationTasks from "../../../public/data/catalysis_v2/catalysis_verification_tasks_v2.json"
import evidenceGraph from "../../../public/data/catalysis_v2/catalysis_evidence_graph_v2.json"
import { CatalysisLiteratureRecordCenter } from "../../components/catalysis/CatalysisLiteratureRecordCenter"
import { THEME_LIGHT } from "../../constants/theme"

describe("CatalysisLiteratureRecordCenter", () => {
  it("merges the record library and verification center under one heading", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    const center = screen.getByTestId("catalysis-literature-record-center")
    expect(center).toHaveTextContent("催化文献与反应记录中心")
    expect(center).toHaveTextContent("DOI 核验来源")
    expect(screen.getByTestId("catalysis-reaction-kpis")).toHaveTextContent(String(verificationDatabase.summary.numericClaimCount))
    expect(screen.getByTestId("catalysis-reaction-kpis")).toHaveTextContent("2含完整运行记录")
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("来源报道指标（4 个数值）")
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("总电流密度")
    expect(center).not.toHaveTextContent("DOI 核验催化反应记录库")
    expect(center).not.toHaveTextContent("催化文献核验中心")
    expect(screen.getByRole("tab", { name: "反应记录与条件" })).toHaveAttribute("aria-selected", "true")
  })

  it("switches to evidence admission without creating a second module shell", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    fireEvent.click(screen.getByRole("tab", { name: "来源核验与使用范围" }))
    expect(screen.getByTestId("catalysis-verification-kpis")).toHaveTextContent(`${verificationDatabase.summary.claimLocatedCount}/${verificationDatabase.summary.numericClaimCount}`)
    expect(screen.getByTestId("catalysis-verification-kpis")).toHaveTextContent("5条件完整运行")
    expect(screen.getByTestId("catalysis-evidence-trace")).toHaveTextContent("来源与核验路径")
    expect(screen.getByTestId("catalysis-literature-record-center").querySelectorAll("section[data-testid='catalysis-verification-center']")).toHaveLength(1)
    expect(screen.getByTestId("catalysis-literature-record-center")).not.toHaveTextContent("催化文献核验中心")
  })

  it("separates a verified article structure identifier from the local identity registry join", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索催化剂、DOI 或材料" }), { target: { value: "Bi-HHTP" } })

    const detail = screen.getByTestId("catalysis-record-detail")
    expect(detail).toHaveTextContent("精确结构已解析")
    expect(detail).toHaveTextContent("论文结构标识CCDC:2242230")
    expect(detail).toHaveTextContent("本地结构 ID尚未连接")
    expect(detail).toHaveTextContent("当前本地 mof_identity_registry 尚无完全匹配条目")
    expect(detail).toHaveTextContent("流动电解池")
    expect(detail).not.toHaveTextContent("liquid-phase flow cell")
    expect(detail).toHaveTextContent("催化剂载量")
    expect(detail).not.toHaveTextContent("catalystLoading")
  })

  it("preserves the active child view when moving between the two center views", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    fireEvent.click(screen.getByRole("tab", { name: "条件覆盖" }))
    fireEvent.click(screen.getByRole("tab", { name: "来源核验与使用范围" }))
    fireEvent.click(screen.getByRole("tab", { name: "反应记录与条件" }))
    expect(screen.getByRole("tab", { name: "条件覆盖" })).toHaveAttribute("aria-selected", "true")
  })

  it("uses a stacked primary selector on mobile", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} isMobile lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    expect(screen.getByRole("tablist", { name: "催化文献与反应记录中心视图" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "反应记录与条件" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "来源核验与使用范围" })).toBeInTheDocument()
  })
})
