import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Project Updates", () => {
  it("renders the six numbered project-update streams for the current release", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    expect(updates).toBeInTheDocument()
    expect(updates.textContent).toMatch(/Project Updates/)
    expect(updates.textContent).toMatch(/App v1\.0\.2/)
    for (const number of ["01", "02", "03", "04", "05", "06"]) {
      expect(within(updates).getByText(number)).toBeInTheDocument()
    }
  })

  it("labels each stream with its work area", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    expect(updates.textContent).toMatch(/Homepage interaction/)
    expect(updates.textContent).toMatch(/Homepage charts/)
    expect(updates.textContent).toMatch(/Library responsiveness/)
    expect(updates.textContent).toMatch(/Localization QA/)
  })
})
