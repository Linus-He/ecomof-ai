import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("ReleaseNotesCenter", () => {
  it("renders release notes by version, module, and category", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-release-notes")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Release Notes Center/)
    expect(bodyText()).toMatch(/Project Evolution Center/)
    expect(bodyText()).toMatch(/Knowledge Architecture Refactor/)
    expect(bodyText()).toMatch(/First-Level Project Evolution Tab/)
    expect(bodyText()).toMatch(/Evolution Center Test Coverage/)
    expect(bodyText()).toMatch(/1000 Candidate Database Preview/)
  })

  it("filters release notes by category", () => {
    render(<ProjectEvolutionTab data={data} />)

    const selects = screen.getAllByRole("combobox")
    const categoryOptions = [...selects[1].querySelectorAll("option")].map(option => option.textContent)
    expect(categoryOptions).toEqual(expect.arrayContaining(["Database", "Algorithm", "Validation", "UI", "Methods", "Infrastructure", "Testing"]))

    fireEvent.change(selects[1], { target: { value: "Validation" } })
    expect(bodyText()).toMatch(/Verified Metadata Breakthrough/)
    expect(bodyText()).toMatch(/Model Validation Lab/)
  })
})
