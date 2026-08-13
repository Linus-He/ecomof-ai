// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import dataset from "../../../public/data/catalysis_reaction_records_v1.json"
import { CatalysisReactionRecordWorkbench } from "../../components/catalysis/CatalysisReactionRecordWorkbench"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx } from "../../contexts"
import { COPY } from "../../i18n"

function renderWorkbench(isMobile = false) {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: () => {} }}>
        <CatalysisReactionRecordWorkbench dataset={dataset} isMobile={isMobile} lang="zh" t={THEME_LIGHT} />
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

describe("CatalysisReactionRecordWorkbench", () => {
  it("shows DOI-backed totals, provenance detail, and the ranking boundary", () => {
    renderWorkbench()
    const workbench = screen.getByTestId("catalysis-reaction-record-workbench")
    const kpis = screen.getByTestId("catalysis-reaction-kpis")

    expect(workbench).toHaveTextContent("DOI 核验催化反应记录库")
    expect(kpis).toHaveTextContent("DOI 核验来源")
    expect(kpis).toHaveTextContent("10")
    expect(kpis).toHaveTextContent("26")
    expect(kpis).toHaveTextContent("含完整运行记录")
    expect(workbench).toHaveTextContent("不同实验条件下不作性能排名")
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("MFM-220-p")
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("DOI 10.1039/D2TA04485D")
    expect(within(workbench).getAllByRole("link", { name: /DOI/i }).length).toBeGreaterThan(1)
  })

  it("switches among condition, active-phase, and non-ranking performance views", () => {
    renderWorkbench()

    fireEvent.click(screen.getByRole("tab", { name: "条件覆盖" }))
    expect(screen.getByTestId("catalysis-condition-matrix")).toHaveTextContent("载量基准")
    expect(screen.getByTestId("catalysis-condition-matrix")).toHaveTextContent("产物定量")

    fireEvent.click(screen.getByRole("tab", { name: "活性相证据" }))
    expect(screen.getByTestId("catalysis-active-phase-matrix")).toHaveTextContent("原位 / 操作态")
    expect(screen.getByTestId("catalysis-active-phase-matrix")).toHaveTextContent("中间体")

    fireEvent.click(screen.getByRole("tab", { name: "文献报道性能" }))
    expect(screen.getByText("来源报道的法拉第效率（条件不一致，不作排名）")).toBeInTheDocument()
    expect(screen.getByTestId("catalysis-fe-chart")).toBeInTheDocument()
    expect(screen.getByText("精确数值与实验条件")).toBeInTheDocument()
  })

  it("filters the shared record set by DOI or catalyst identity", () => {
    renderWorkbench(true)
    const search = screen.getByRole("searchbox", { name: "搜索催化剂、DOI 或材料" })

    fireEvent.change(search, { target: { value: "TAL-33" } })

    expect(screen.getByText("显示 1 / 10")).toBeInTheDocument()
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("TAL-33 衍生铋催化剂")
    expect(screen.getByTestId("catalysis-record-detail")).toHaveTextContent("未提取")
  })
})
