// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import queue from "../../../public/data/catalysis_v2/catalysis_candidate_queue_v1.json"
import suggestions from "../../../public/data/catalysis_v2/catalysis_extraction_suggestions_v1.json"
import batches from "../../../public/data/catalysis_v2/catalysis_discovery_batches_v1.json"
import { CatalysisDiscoveryWorkbench } from "../../components/catalysis/CatalysisDiscoveryWorkbench"
import { THEME_LIGHT } from "../../constants/theme"

describe("CatalysisDiscoveryWorkbench", () => {
  it("shows the real discovery funnel and the non-promotion boundary", () => {
    render(<CatalysisDiscoveryWorkbench batchDataset={batches} queueDataset={queue} suggestionDataset={suggestions} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByTestId("catalysis-discovery-workbench")).toHaveTextContent("催化文献候选与全文核对")
    expect(screen.getByTestId("catalysis-discovery-funnel")).toHaveTextContent("250")
    expect(screen.getByTestId("catalysis-discovery-funnel")).toHaveTextContent("155")
    expect(screen.getByTestId("catalysis-discovery-funnel")).toHaveTextContent("9")
    expect(screen.getByTestId("catalysis-discovery-funnel")).toHaveTextContent("未经人工核验直接入库")
    expect(screen.getByTestId("catalysis-discovery-inspector")).toHaveTextContent("题名初步识别")
    expect(screen.getByTestId("catalysis-discovery-inspector")).toHaveTextContent("待全文核对")
  })

  it("filters C2+ candidates and switches the inspector", () => {
    render(<CatalysisDiscoveryWorkbench batchDataset={batches} queueDataset={queue} suggestionDataset={suggestions} lang="zh" t={THEME_LIGHT} />)
    fireEvent.click(screen.getByRole("tab", { name: /C2\+ 产物/ }))
    expect(screen.getByTestId("catalysis-discovery-candidate-list").querySelectorAll("button")).toHaveLength(2)
    fireEvent.click(screen.getByText(/Highly Ethylene/))
    expect(screen.getByTestId("catalysis-discovery-inspector")).toHaveTextContent("10.1002/anie.202111700")
    expect(screen.getByTestId("catalysis-discovery-inspector")).toHaveTextContent("全文中的实验声明、条件、结构身份、活性相与许可仍待人工核查")
  })

  it("renders the mobile workbench as an operable single-column surface", () => {
    render(<CatalysisDiscoveryWorkbench batchDataset={batches} queueDataset={queue} suggestionDataset={suggestions} isMobile lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByRole("tablist")).toBeInTheDocument()
    expect(screen.getByText("写入正式记录前须核对")).toBeInTheDocument()
    expect(screen.getByText("精确结构身份")).toBeInTheDocument()
  })
})
