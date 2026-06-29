import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Project Updates", () => {
  it("renders the four numbered project-update streams for the current release", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    expect(updates).toBeInTheDocument()
    expect(updates.textContent).toMatch(/Project Updates/)
    expect(updates.textContent).toMatch(/V3\.10\.1/)
    for (const number of ["01", "02", "03", "04"]) {
      expect(within(updates).getByText(number)).toBeInTheDocument()
    }
  })

  it("labels each stream with its work area", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    expect(updates.textContent).toMatch(/IAST selectivity/)
    expect(updates.textContent).toMatch(/Identity resolution/)
    expect(updates.textContent).toMatch(/Coverage surfaced/)
    expect(updates.textContent).toMatch(/Proxy validation and comparison/)
  })
})
