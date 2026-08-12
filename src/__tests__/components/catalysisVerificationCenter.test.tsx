// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import tasks from "../../../public/data/catalysis_v2/catalysis_verification_tasks_v2.json"
import graph from "../../../public/data/catalysis_v2/catalysis_evidence_graph_v2.json"
import { CatalysisVerificationCenter } from "../../components/catalysis/CatalysisVerificationCenter"
import { THEME_LIGHT } from "../../constants/theme"

describe("CatalysisVerificationCenter", () => {
  it("shows real gate counts, evidence graph integration, and the task queue", () => {
    render(<CatalysisVerificationCenter database={database} tasksDataset={tasks} graph={graph} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByTestId("catalysis-verification-center")).toHaveTextContent("催化文献核验中心")
    expect(screen.getByTestId("catalysis-verification-kpis")).toHaveTextContent("10")
    expect(screen.getByTestId("catalysis-verification-kpis")).toHaveTextContent("12/26")
    expect(screen.getByTestId("catalysis-eligibility-matrix")).toHaveTextContent("MFM-220-p")
    expect(screen.getByTestId("catalysis-evidence-trace")).toHaveTextContent("论文")
    expect(screen.getByTestId("catalysis-l4-claim-ledger")).toHaveTextContent("图 3a")
    expect(screen.getByTestId("catalysis-verification-center")).toHaveTextContent(`${graph.summary.nodeCount} 证据节点`)
    expect(screen.getByTestId("catalysis-verification-queue")).toHaveTextContent("核验精确结构身份")
  })

  it("switches the evidence trace to the selected record and exposes publisher locations", () => {
    render(<CatalysisVerificationCenter database={database} tasksDataset={tasks} graph={graph} lang="zh" t={THEME_LIGHT} />)
    fireEvent.change(screen.getByLabelText("选择催化记录"), { target: { value: "catrxn-v2-bi-hhtp-formate-2023" } })
    expect(screen.getByTestId("catalysis-l4-claim-ledger")).toHaveTextContent("图 3c")
    expect(screen.getByTestId("catalysis-l4-claim-ledger").querySelectorAll('a[href="https://pubs.rsc.org/en/content/articlehtml/2023/sc/d3sc01876h"]')).toHaveLength(6)
  })

  it("filters P0 claim-location tasks", () => {
    render(<CatalysisVerificationCenter database={database} tasksDataset={tasks} graph={graph} lang="zh" t={THEME_LIGHT} />)
    fireEvent.change(screen.getByLabelText("任务优先级"), { target: { value: "P0" } })
    fireEvent.change(screen.getByLabelText("任务类型"), { target: { value: "claim-location-backfill" } })
    expect(screen.getByTestId("catalysis-verification-queue")).toHaveTextContent("补齐数值的图表或补充材料位置")
    expect(screen.getByTestId("catalysis-verification-queue")).not.toHaveTextContent("核验模型训练使用许可")
  })
})
