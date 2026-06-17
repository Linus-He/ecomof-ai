import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import { ResearchReportsTab } from "../../components/tabs/ResearchReportsTab"

describe("researchReportsShellReady", () => {
  it("keeps Run Snapshot and Localization Audit shell markers stable", () => {
    render(<ResearchReportsTab records={records} summary={summary} versionData={versionData} />)

    expect(screen.getByTestId("research-reports-snapshot")).toHaveAttribute("data-shell-ready", "true")
    expect(screen.getByTestId("research-reports-localization-audit")).toHaveAttribute("data-shell-ready", "true")
    expect(screen.getByTestId("research-reports-chart-pack")).toBeInTheDocument()
  })
})
