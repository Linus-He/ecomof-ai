import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReleaseNotesPage } from "../../components/pages/ReleaseNotesPage"
import { ScientificMilestonesPage } from "../../components/pages/MilestoneRoadmapPages"

describe("Unified release context", () => {
  it("keeps the current release summary in the independent changelog", () => {
    render(<ReleaseNotesPage />)
    const page = screen.getByTestId("release-notes-page")
    expect(page.textContent).toMatch(/v3\.5\.1/)
    expect(page.textContent).toMatch(/2026-08-20/)
    expect(page.textContent).toMatch(/Scientific Milestones|科学里程碑/)
  })

  it("keeps historical milestones visible outside the removed Project Evolution page", () => {
    render(<ScientificMilestonesPage />)
    const page = screen.getByTestId("scientific-milestones-page")
    expect(page.textContent).toMatch(/First OpenMOF Seed/)
    expect(page.textContent).toMatch(/V3\.9\.8/)
  })
})
