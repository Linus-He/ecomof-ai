import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { ResearchReportsTab } from "../../components/tabs/ResearchReportsTab"

function renderTab() {
  return render(<ResearchReportsTab records={records} summary={summary} versionData={versionData} />)
}

describe("Research report A/B narrative", () => {
  it("offers candidate (per-candidate) and round (per-round) sub-tabs", () => {
    renderTab()
    expect(screen.getByTestId("research-report-group-candidate")).toBeInTheDocument()
    expect(screen.getByTestId("research-report-group-round")).toBeInTheDocument()
  })

  it("renders a four-block compact narrative without duplicating the executive summary card", () => {
    renderTab()
    const narrative = screen.getByTestId("research-report-narrative")
    expect(narrative.textContent).toMatch(/Conclusion \(with uncertainty|结论（带不确定度/)
    expect(narrative.textContent).toMatch(/Evidence & Provenance|证据与溯源/)
    expect(narrative.textContent).toMatch(/Limitations \/ Data gaps|已知局限/)
    expect(narrative.textContent).toMatch(/Next steps|下一步建议/)
    // the "执行摘要" section title must not be repeated as its own card
    expect(narrative.textContent).not.toMatch(/执行摘要/)
  })

  it("switches to the round-facing screening report", () => {
    renderTab()
    fireEvent.click(screen.getByTestId("research-report-group-round"))
    const generator = screen.getByTestId("research-reports-generator")
    expect(within(generator).getAllByText("Screening Report").length).toBeGreaterThan(0)
  })
})
