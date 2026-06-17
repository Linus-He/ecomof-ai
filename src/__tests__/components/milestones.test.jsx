import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Milestone Center", () => {
  it("renders the milestone timeline from the authoritative evolution data", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-milestones")).toBeInTheDocument()
    expect(data.overview.milestoneCount).toBe(data.milestones.length)
    expect(bodyText()).toMatch(/First OpenMOF Seed/)
    expect(bodyText()).toMatch(/First Screening Trace/)

    fireEvent.click(within(screen.getByTestId("project-evolution-milestones")).getByRole("button", { name: /Project Evolution Center/i }))
    expect(bodyText()).toMatch(/Project evolution became a first-level navigation center/)
  })
})
