import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ScientificMilestonesPage } from "../../components/pages/MilestoneRoadmapPages"

function bodyText() {
  return document.body.textContent || ""
}

describe("Milestone Center", () => {
  it("renders scientific milestones as an independent page", () => {
    render(<ScientificMilestonesPage />)

    expect(screen.getByTestId("scientific-milestones-page")).toBeInTheDocument()
    expect(data.overview.milestoneCount).toBe(data.milestones.length)
    expect(bodyText()).toMatch(/First OpenMOF Seed/)
    expect(bodyText()).toMatch(/First Screening Trace/)
    expect(bodyText()).toMatch(/Project evolution became a first-level navigation center/)
  })
})
