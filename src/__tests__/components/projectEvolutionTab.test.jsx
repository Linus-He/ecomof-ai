import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { TABS } from "../../constants/badges"
import { HASH_TO_TAB } from "../../utils/deepLinks"
import { ReleaseNotesPage } from "../../components/pages/ReleaseNotesPage"
import { ScientificMilestonesPage, ResearchRoadmapPage } from "../../components/pages/MilestoneRoadmapPages"
import { APP_VERSION_LABEL } from "../../constants/appVersion"

function bodyText() {
  return document.body.textContent || ""
}

describe("ProjectEvolutionTab", () => {
  it("removes Project Evolution from first-level navigation and splits the content into project pages", () => {
    expect(TABS.some(tab => tab.id === "projectEvolution")).toBe(false)
    expect(HASH_TO_TAB["project-evolution"]).toBe("releaseNotes")
    expect(HASH_TO_TAB["project-evolution-milestones"]).toBe("scientificMilestones")
    expect(HASH_TO_TAB["project-evolution-roadmap"]).toBe("researchRoadmap")

    render(<ReleaseNotesPage />)

    expect(screen.getByTestId("release-notes-page")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Changelog/)
    expect(bodyText()).toContain(APP_VERSION_LABEL.replace(/^Web /, ""))
  })

  it("renders scientific milestones and roadmap as independent pages", () => {
    render(<>
      <ScientificMilestonesPage />
      <ResearchRoadmapPage />
    </>)

    expect(screen.getByTestId("scientific-milestones-page")).toBeInTheDocument()
    expect(screen.getByTestId("research-roadmap-page")).toBeInTheDocument()
    expect(data.overview.milestoneCount).toBe(data.milestones.length)
    expect(bodyText()).toMatch(/First OpenMOF Seed/)
    expect(bodyText()).toMatch(/Scientific goal/)
  })
})
