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
    expect(center).not.toHaveTextContent("DOI 核验催化反应记录库")
    expect(center).not.toHaveTextContent("催化文献核验中心")
    expect(screen.getByRole("tab", { name: "反应记录与条件" })).toHaveAttribute("aria-selected", "true")
  })

  it("switches to evidence admission without creating a second module shell", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    fireEvent.click(screen.getByRole("tab", { name: "来源核验与使用范围" }))
    expect(screen.getByTestId("catalysis-verification-kpis")).toHaveTextContent("12/26")
    expect(screen.getByTestId("catalysis-evidence-trace")).toHaveTextContent("来源与核验路径")
    expect(screen.getByTestId("catalysis-literature-record-center").querySelectorAll("section[data-testid='catalysis-verification-center']")).toHaveLength(1)
    expect(screen.getByTestId("catalysis-literature-record-center")).not.toHaveTextContent("催化文献核验中心")
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
