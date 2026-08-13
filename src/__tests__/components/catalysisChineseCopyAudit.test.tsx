// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import recordDataset from "../../../public/data/catalysis_reaction_records_v1.json"
import verificationDatabase from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import verificationTasks from "../../../public/data/catalysis_v2/catalysis_verification_tasks_v2.json"
import evidenceGraph from "../../../public/data/catalysis_v2/catalysis_evidence_graph_v2.json"
import queue from "../../../public/data/catalysis_v2/catalysis_candidate_queue_v1.json"
import suggestions from "../../../public/data/catalysis_v2/catalysis_extraction_suggestions_v1.json"
import batches from "../../../public/data/catalysis_v2/catalysis_discovery_batches_v1.json"
import { CatalysisLiteratureRecordCenter } from "../../components/catalysis/CatalysisLiteratureRecordCenter"
import { CatalysisDiscoveryWorkbench } from "../../components/catalysis/CatalysisDiscoveryWorkbench"
import { THEME_LIGHT } from "../../constants/theme"

const INTERNAL_COPY = /literature-curated|demo\s*\/\s*seed|机器辅助字段建议|隔离门控|自动晋级|L4 声明|publisher abstract|missing-condition|training-license-not-cleared/i

describe("catalysis Chinese copy audit", () => {
  it("keeps record and verification views free of internal workflow wording", () => {
    render(<CatalysisLiteratureRecordCenter evidenceGraph={evidenceGraph} lang="zh" recordDataset={recordDataset} t={THEME_LIGHT} verificationDatabase={verificationDatabase} verificationTasks={verificationTasks} />)
    const center = screen.getByTestId("catalysis-literature-record-center")
    expect(center.textContent).not.toMatch(INTERNAL_COPY)
    expect(center).toHaveTextContent("出版方全文")
    expect(center).toHaveTextContent("补充材料")
    expect(center).toHaveTextContent("催化剂载量")

    fireEvent.click(screen.getByRole("tab", { name: "来源核验与使用范围" }))
    expect(center.textContent).not.toMatch(INTERNAL_COPY)
    expect(center).toHaveTextContent("数值声明尚未精确定位到图表、章节或补充材料")
    expect(center).toHaveTextContent("获得论文元数据不等于取得全文数据的模型训练使用许可")
  })

  it("shows Chinese candidate titles first and replaces prompt-like labels", () => {
    render(<CatalysisDiscoveryWorkbench batchDataset={batches} queueDataset={queue} suggestionDataset={suggestions} lang="zh" t={THEME_LIGHT} />)
    const workbench = screen.getByTestId("catalysis-discovery-workbench")
    expect(workbench.textContent).not.toMatch(INTERNAL_COPY)
    expect(workbench).toHaveTextContent("单铜位点金属有机框架")
    expect(workbench).toHaveTextContent("题名初步识别")
    expect(workbench).toHaveTextContent("把握度：中")
  })
})
